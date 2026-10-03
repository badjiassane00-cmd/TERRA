#!/usr/bin/env python3
"""Collect open-licensed GBIF photos and train a lightweight BioCLIP head.

Run this script in a GPU-backed Google Colab session. It does not fine-tune or
replace BioCLIP; it trains a Ridge classifier on frozen BioCLIP image embeddings.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import os
import random
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps, UnidentifiedImageError

GBIF_OCCURRENCE_URL = "https://api.gbif.org/v1/occurrence/search"
OPEN_LICENSES = {
    "cc0-1.0": "CC0-1.0",
    "cc-by-4.0": "CC-BY-4.0",
    "cc-by-sa-4.0": "CC-BY-SA-4.0",
    "cc0_1_0": "CC0-1.0",
    "cc_by_4_0": "CC-BY-4.0",
    "cc_by_sa_4_0": "CC-BY-SA-4.0",
}
KINGDOMS = ("Animalia", "Plantae", "Fungi", "Chromista", "Protozoa")
FISH_CLASSES = {"actinopterygii", "chondrichthyes", "myxini", "petromyzonti", "sarcopterygii"}
LAND_VERTEBRATE_CLASSES = {"amphibia", "aves", "mammalia", "reptilia"}
IMAGE_EXTENSIONS = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}
MANIFEST_FIELDS = (
    "path", "scientific_name", "group", "license", "creator", "rights_holder",
    "occurrence_id", "publisher", "image_url",
)


def normalized_license(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip().lower().rstrip("/")
    if "creativecommons.org/publicdomain/zero/1.0" in normalized:
        return "CC0-1.0"
    if "creativecommons.org/licenses/by-sa/4.0" in normalized:
        return "CC-BY-SA-4.0"
    if "creativecommons.org/licenses/by/4.0" in normalized:
        return "CC-BY-4.0"
    return OPEN_LICENSES.get(normalized.rsplit("/", 1)[-1])


def group_for_record(record: dict[str, Any]) -> str | None:
    kingdom = str(record.get("kingdom") or "").casefold()
    taxon_class = str(record.get("class") or "").casefold()
    phylum = str(record.get("phylum") or "").casefold()
    if kingdom == "plantae":
        return "plants"
    if kingdom == "fungi":
        return "fungi"
    if kingdom == "animalia":
        if taxon_class == "insecta" or (phylum and phylum != "chordata"):
            return "insects"
        if taxon_class in FISH_CLASSES:
            return "fish"
        if taxon_class in LAND_VERTEBRATE_CLASSES:
            return "animals"
        if phylum == "chordata":
            return "animals"
        return "insects"
    return "other"


def request_json(url: str) -> dict[str, Any]:
    request = urllib.request.Request(url, headers={"User-Agent": "TERRA-BioCLIP-training/1.0", "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return json.loads(response.read())
        except urllib.error.HTTPError as error:
            if error.code != 429 or attempt == 3:
                raise
            time.sleep(2 ** attempt)
    raise RuntimeError("GBIF request retries exhausted")


def open_media(record: dict[str, Any]) -> list[dict[str, Any]]:
    accepted = []
    for media in record.get("media") or []:
        if str(media.get("type") or "").casefold() != "stillimage":
            continue
        license_name = normalized_license(media.get("license"))
        identifier = media.get("identifier")
        if license_name and isinstance(identifier, str) and identifier.startswith("https://"):
            accepted.append({**media, "license_name": license_name})
    return accepted


def collect(args: argparse.Namespace) -> None:
    random.seed(args.seed)
    args.workdir.mkdir(parents=True, exist_ok=True)
    checkpoint_path = args.workdir / "gbif-scan-checkpoint.json"
    media_cache_path = args.workdir / "gbif-media.jsonl"
    checkpoint = {"page_size": args.page_size, "next_page": {}}
    if checkpoint_path.is_file():
        checkpoint = json.loads(checkpoint_path.read_text(encoding="utf-8"))
        if checkpoint.get("page_size") != args.page_size:
            raise RuntimeError("--page-size differs from the saved checkpoint. Reuse the original value or choose a new --workdir.")

    counts: Counter[tuple[str, str, str]] = Counter()
    records: dict[tuple[str, str, str], list[dict[str, Any]]] = defaultdict(list)
    seen_urls: set[str] = set()
    if media_cache_path.is_file():
        with media_cache_path.open(encoding="utf-8") as media_cache:
            for line in media_cache:
                try:
                    item = json.loads(line)
                    key = (item["group"], item["species_key"], item["scientific_name"])
                    url = item["url"]
                    if url in seen_urls:
                        continue
                    seen_urls.add(url)
                    counts[key] += 1
                    records[key].append({field: item[field] for field in (
                        "url", "license", "creator", "rights_holder", "occurrence_id", "publisher",
                    )})
                except (KeyError, json.JSONDecodeError):
                    continue

    def save_checkpoint() -> None:
        temporary_path = checkpoint_path.with_suffix(".tmp")
        temporary_path.write_text(json.dumps(checkpoint), encoding="utf-8")
        os.replace(temporary_path, checkpoint_path)

    for kingdom in KINGDOMS:
        start_page = int(checkpoint["next_page"].get(kingdom, 0))
        if start_page >= args.pages_per_kingdom:
            print(f"GBIF kingdom already scanned: {kingdom} ({start_page} pages)", flush=True)
            continue
        print(f"Scanning GBIF kingdom: {kingdom} from page {start_page + 1}", flush=True)
        for page in range(start_page, args.pages_per_kingdom):
            offset = page * args.page_size
            query = urllib.parse.urlencode({
                "kingdom": kingdom,
                "mediaType": "StillImage",
                "occurrenceStatus": "PRESENT",
                "limit": args.page_size,
                "offset": offset,
            })
            payload = request_json(f"{GBIF_OCCURRENCE_URL}?{query}")
            occurrences = payload.get("results") or []
            if not occurrences:
                checkpoint["next_page"][kingdom] = args.pages_per_kingdom
                save_checkpoint()
                break
            page_media: list[dict[str, str]] = []
            for occurrence in occurrences:
                if str(occurrence.get("taxonRank") or "").upper() != "SPECIES":
                    continue
                if str(occurrence.get("taxonomicStatus") or "ACCEPTED").upper() != "ACCEPTED":
                    continue
                scientific_name = str(occurrence.get("species") or "").strip()
                species_key = occurrence.get("speciesKey")
                group = group_for_record(occurrence)
                if not scientific_name or not species_key or not group:
                    continue
                key = (group, str(species_key), scientific_name)
                for media in open_media(occurrence):
                    url = media["identifier"]
                    if url in seen_urls:
                        continue
                    seen_urls.add(url)
                    media_item = {
                        "group": group,
                        "species_key": str(species_key),
                        "scientific_name": scientific_name,
                        "url": url,
                        "license": media["license_name"],
                        "creator": str(media.get("creator") or ""),
                        "rights_holder": str(media.get("rightsHolder") or ""),
                        "occurrence_id": str(occurrence.get("key") or ""),
                        "publisher": str(occurrence.get("publishingOrgKey") or ""),
                    }
                    page_media.append(media_item)
                    records[key].append({field: media_item[field] for field in (
                        "url", "license", "creator", "rights_holder", "occurrence_id", "publisher",
                    )})
                    counts[key] += 1
            if page_media:
                with media_cache_path.open("a", encoding="utf-8") as media_cache:
                    for media_item in page_media:
                        media_cache.write(json.dumps(media_item, ensure_ascii=True) + "\n")
                    media_cache.flush()
                    os.fsync(media_cache.fileno())
            checkpoint["next_page"][kingdom] = page + 1
            save_checkpoint()
            time.sleep(args.delay)
            if (page + 1) % 10 == 0:
                print(f"  {page + 1}/{args.pages_per_kingdom} pages", flush=True)

    eligible_by_group: dict[str, list[tuple[tuple[str, str, str], int]]] = defaultdict(list)
    for key, count in counts.items():
        if count >= args.min_images:
            eligible_by_group[key[0]].append((key, count))

    selected: list[tuple[str, str, str]] = []
    for group, species in sorted(eligible_by_group.items()):
        species.sort(key=lambda item: (-item[1], item[0][2]))
        chosen = species[:args.max_species_per_group]
        selected.extend(item[0] for item in chosen)
        print(f"Eligible {group}: {len(species)} species; collecting {len(chosen)}", flush=True)

    if len(selected) < 2:
        raise RuntimeError("Too few GBIF species meet the licensed-image threshold; increase scan pages or lower --min-images.")

    image_dir = args.workdir / "images"
    image_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = args.workdir / "manifest.csv"
    downloaded = 0
    downloaded_per_species: Counter[tuple[str, str]] = Counter()
    seen_digests: set[str] = set()
    downloaded_urls: set[str] = set()
    if manifest_path.is_file():
        with manifest_path.open(newline="", encoding="utf-8") as manifest_file:
            for row in csv.DictReader(manifest_file):
                downloaded_urls.add(row["image_url"])
                downloaded_per_species[(row["group"], row["scientific_name"])] += 1
                seen_digests.add(Path(row["path"]).stem)
                downloaded += 1
    manifest_exists = manifest_path.is_file() and manifest_path.stat().st_size > 0
    with manifest_path.open("a", newline="", encoding="utf-8") as manifest_file:
        writer = csv.DictWriter(manifest_file, fieldnames=MANIFEST_FIELDS)
        if not manifest_exists:
            writer.writeheader()
        for key in selected:
            group, _, scientific_name = key
            consecutive_failures = 0
            for item in records[key]:
                if downloaded_per_species[(group, scientific_name)] >= args.max_images:
                    break
                if item["url"] in downloaded_urls:
                    continue
                if consecutive_failures >= args.max_failures_per_species:
                    break
                try:
                    image_request = urllib.request.Request(item["url"], headers={"User-Agent": "TERRA-BioCLIP-training/1.0"})
                    with urllib.request.urlopen(image_request, timeout=args.download_timeout) as response:
                        data = response.read(args.max_image_bytes + 1)
                    if not data or len(data) > args.max_image_bytes:
                        consecutive_failures += 1
                        continue
                    with Image.open(io.BytesIO(data)) as opened:
                        image = ImageOps.exif_transpose(opened).convert("RGB")
                        image_format = opened.format or ""
                        if image_format not in IMAGE_EXTENSIONS or min(image.size) < 80:
                            consecutive_failures += 1
                            continue
                        extension = IMAGE_EXTENSIONS[image_format]
                        digest = hashlib.sha256(data).hexdigest()
                        if digest in seen_digests:
                            consecutive_failures = 0
                            continue
                        seen_digests.add(digest)
                        path = image_dir / f"{digest}{extension}"
                        if not path.exists():
                            path.write_bytes(data)
                    writer.writerow({
                        "path": path.relative_to(args.workdir).as_posix(),
                        "scientific_name": scientific_name,
                        "group": group,
                        "license": item["license"],
                        "creator": item["creator"],
                        "rights_holder": item["rights_holder"],
                        "occurrence_id": item["occurrence_id"],
                        "publisher": item["publisher"],
                        "image_url": item["url"],
                    })
                    downloaded += 1
                    downloaded_urls.add(item["url"])
                    downloaded_per_species[(group, scientific_name)] += 1
                    consecutive_failures = 0
                except (OSError, urllib.error.URLError, UnidentifiedImageError):
                    consecutive_failures += 1
                    continue
            if downloaded and downloaded % 100 == 0:
                print(f"  Downloaded {downloaded} images", flush=True)

    trainable_species = sum(count >= args.min_images for count in downloaded_per_species.values())
    print(f"Collected {downloaded} unique open-licensed images for {len(downloaded_per_species)} species", flush=True)
    print(f"Species meeting the {args.min_images}-image training minimum: {trainable_species}", flush=True)
    print(f"Manifest: {manifest_path}", flush=True)
    print("Review manifest.csv attribution and coverage before training.", flush=True)


def train(args: argparse.Namespace) -> None:
    import numpy as np
    import torch
    from bioclip.predict import TreeOfLifeClassifier
    from sklearn.linear_model import RidgeClassifier
    from sklearn.metrics import accuracy_score
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import LabelEncoder

    rows = []
    with args.manifest.open(newline="", encoding="utf-8") as manifest_file:
        for row in csv.DictReader(manifest_file):
            path = args.workdir / row["path"]
            if path.is_file() and row["license"] in OPEN_LICENSES.values():
                rows.append({**row, "path": path})

    counts = Counter(row["scientific_name"] for row in rows)
    eligible_names = {name for name, count in counts.items() if count >= args.min_images}
    rows = [row for row in rows if row["scientific_name"] in eligible_names]
    if len(eligible_names) < 2:
        raise RuntimeError("Need at least two species with enough licensed images before training.")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Loading BioCLIP on {device}; extracting frozen image embeddings...", flush=True)
    model_name = os.getenv("BIOCLIP_MODEL", "hf-hub:imageomics/bioclip")
    classifier = TreeOfLifeClassifier(model_str=model_name, device=device)
    labels = classifier.get_label_data()
    label_name_to_index = {
        str(name).strip().casefold(): index
        for index, name in enumerate(labels["species"].fillna(""))
        if str(name).strip()
    }
    rows = [row for row in rows if row["scientific_name"].casefold() in label_name_to_index]
    counts = Counter(row["scientific_name"] for row in rows)
    eligible_names = sorted(name for name, count in counts.items() if count >= args.min_images)
    if len(eligible_names) < 2:
        raise RuntimeError("GBIF species labels did not match BioCLIP taxonomy; no head was trained.")
    rows = [row for row in rows if row["scientific_name"] in set(eligible_names)]

    features = []
    names = []
    groups = []
    embedded_rows = []
    for index, row in enumerate(rows, start=1):
        try:
            with Image.open(row["path"]) as opened:
                image = ImageOps.exif_transpose(opened).convert("RGB")
                feature = classifier.create_image_features_for_image(image, normalize=True)
            features.append(feature.detach().cpu().float().flatten().numpy())
            names.append(row["scientific_name"])
            groups.append(row["group"])
            embedded_rows.append(row)
        except (OSError, UnidentifiedImageError) as error:
            print(f"Skipping unreadable image {row['path']}: {error}", flush=True)
        if index % 100 == 0:
            print(f"  Embedded {index}/{len(rows)} images", flush=True)

    encoder = LabelEncoder()
    targets = encoder.fit_transform(names)
    class_counts = Counter(targets)
    keep = np.array([class_counts[target] >= args.min_images for target in targets])
    features_array = np.asarray(features, dtype=np.float32)[keep]
    targets_array = targets[keep]
    groups_array = np.asarray(groups)[keep]
    used_rows = [row for row, retained in zip(embedded_rows, keep) if retained]
    classes = encoder.classes_
    retained_classes = sorted(set(targets_array.tolist()))
    if len(retained_classes) < 2:
        raise RuntimeError("Fewer than two species remain after embedding extraction.")

    train_x, valid_x, train_y, valid_y = train_test_split(
        features_array, targets_array, test_size=args.validation_fraction,
        random_state=args.seed, stratify=targets_array,
    )
    head = RidgeClassifier(alpha=args.alpha, class_weight="balanced")
    head.fit(train_x, train_y)
    raw_validation_scores = head.decision_function(valid_x)
    if raw_validation_scores.ndim == 1:
        validation_scores = np.column_stack((-raw_validation_scores, raw_validation_scores))
    else:
        validation_scores = raw_validation_scores
    predicted = head.classes_[np.argmax(validation_scores, axis=1)]
    accuracy = float(accuracy_score(valid_y, predicted))
    top_k = min(5, validation_scores.shape[1])
    top_indices = np.argsort(validation_scores, axis=1)[:, -top_k:]
    top5_accuracy = float(np.mean([target in head.classes_[indices] for target, indices in zip(valid_y, top_indices)]))
    shifted_scores = validation_scores - validation_scores.max(axis=1, keepdims=True)
    exp_scores = np.exp(shifted_scores)
    validation_probabilities = exp_scores / exp_scores.sum(axis=1, keepdims=True)
    max_scores = validation_probabilities.max(axis=1)
    correct = predicted == valid_y
    thresholds = np.unique(max_scores)
    acceptable = [threshold for threshold in thresholds if correct[max_scores >= threshold].mean() >= args.minimum_precision and np.any(max_scores >= threshold)]
    if not acceptable:
        raise RuntimeError("Validation could not meet minimum precision; collect more images or review labels.")
    min_confidence = float(min(acceptable))

    class_names = [str(classes[index]) for index in head.classes_]
    class_groups = []
    for name in class_names:
        matching = next((row["group"] for row in rows if row["scientific_name"] == name), "other")
        class_groups.append(matching)
    output = args.output
    output.parent.mkdir(parents=True, exist_ok=True)
    attribution_path = output.with_name(f"{output.stem}-attributions.csv")
    with attribution_path.open("w", newline="", encoding="utf-8") as attribution_file:
        writer = csv.DictWriter(attribution_file, fieldnames=MANIFEST_FIELDS)
        writer.writeheader()
        writer.writerows({field: row.get(field, "") for field in MANIFEST_FIELDS} for row in used_rows)
    weights = head.coef_
    bias = head.intercept_
    if weights.shape[0] == 1 and len(class_names) == 2:
        weights = np.concatenate((-weights, weights), axis=0)
        bias = np.concatenate((-bias, bias), axis=0)
    torch.save({
        "format_version": 1,
        "model_name": os.getenv("BIOCLIP_MODEL", "hf-hub:imageomics/bioclip"),
        "class_names": class_names,
        "class_groups": class_groups,
        "weights": torch.tensor(weights, dtype=torch.float32),
        "bias": torch.tensor(bias, dtype=torch.float32),
        "min_confidence": min_confidence,
        "validation_accuracy": accuracy,
        "validation_top5_accuracy": top5_accuracy,
        "minimum_precision": args.minimum_precision,
        "training_image_count": int(len(train_y)),
        "validation_image_count": int(len(valid_y)),
        "gbif_licenses": sorted({row["license"] for row in rows}),
    }, output)
    print(json.dumps({
        "artifact": str(output),
        "attributions": str(attribution_path),
        "species": len(class_names),
        "images": len(features_array),
        "trainingImages": len(train_y),
        "validationImages": len(valid_y),
        "validationAccuracy": accuracy,
        "validationTop5Accuracy": top5_accuracy,
        "minConfidence": min_confidence,
        "classesByGroup": dict(Counter(class_groups)),
    }, ensure_ascii=True, indent=2), flush=True)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    collect_parser = commands.add_parser("collect", help="Collect open-licensed GBIF species images")
    collect_parser.add_argument("--workdir", type=Path, default=Path("/content/terra-gbif"))
    collect_parser.add_argument("--pages-per-kingdom", type=int, default=200)
    collect_parser.add_argument("--page-size", type=int, default=300)
    collect_parser.add_argument("--min-images", type=int, default=20)
    collect_parser.add_argument("--max-images", type=int, default=30)
    collect_parser.add_argument("--max-species-per-group", type=int, default=250)
    collect_parser.add_argument("--max-image-bytes", type=int, default=12 * 1024 * 1024)
    collect_parser.add_argument("--download-timeout", type=int, default=12)
    collect_parser.add_argument("--max-failures-per-species", type=int, default=5)
    collect_parser.add_argument("--delay", type=float, default=0.15)
    collect_parser.add_argument("--seed", type=int, default=42)
    train_parser = commands.add_parser("train", help="Train and validate a linear BioCLIP head")
    train_parser.add_argument("--workdir", type=Path, default=Path("/content/terra-gbif"))
    train_parser.add_argument("--manifest", type=Path, default=Path("/content/terra-gbif/manifest.csv"))
    train_parser.add_argument("--output", type=Path, default=Path("/content/terra-bioclip-head.pt"))
    train_parser.add_argument("--min-images", type=int, default=20)
    train_parser.add_argument("--alpha", type=float, default=1.0)
    train_parser.add_argument("--validation-fraction", type=float, default=0.2)
    train_parser.add_argument("--minimum-precision", type=float, default=0.8)
    train_parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


if __name__ == "__main__":
    arguments = parse_args()
    if arguments.command == "collect":
        arguments.workdir.mkdir(parents=True, exist_ok=True)
        collect(arguments)
    else:
        train(arguments)
