import io
import os
from pathlib import Path
from threading import Lock
from typing import Any

import torch
from bioclip._constants import Rank
from bioclip.predict import TreeOfLifeClassifier
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MODEL_NAME = os.getenv("BIOCLIP_MODEL", "hf-hub:imageomics/bioclip")
HEAD_PATH = Path(os.getenv("BIOCLIP_HEAD_PATH", "/app/models/terra-bioclip-head.pt"))
app = FastAPI(title="TERRA BioCLIP", docs_url=None, redoc_url=None)
classifier: TreeOfLifeClassifier | None = None
taxa_masks: dict[str, torch.Tensor] = {}
trained_head: dict[str, Any] | None = None
inference_lock = Lock()


@app.on_event("startup")
def load_classifier():
    global classifier, taxa_masks, trained_head
    torch.set_num_threads(max(1, min(4, os.cpu_count() or 1)))
    classifier = TreeOfLifeClassifier(model_str=MODEL_NAME, device="cpu")
    labels = classifier.get_label_data()
    kingdom = labels["kingdom"].fillna("").str.casefold()
    phylum = labels["phylum"].fillna("").str.casefold()
    taxon_class = labels["class"].fillna("").str.casefold()
    terrestrial_classes = {"amphibia", "aves", "mammalia", "reptilia"}
    taxa_masks = {
        "plants": torch.as_tensor(kingdom.eq("plantae").to_numpy(), dtype=torch.bool),
        "insects": torch.as_tensor((kingdom.eq("animalia") & (taxon_class.eq("insecta") | phylum.ne("chordata"))).to_numpy(), dtype=torch.bool),
        "animals": torch.as_tensor((kingdom.eq("animalia") & taxon_class.isin(terrestrial_classes)).to_numpy(), dtype=torch.bool),
        "fish": torch.as_tensor((kingdom.eq("animalia") & phylum.eq("chordata") & ~taxon_class.isin(terrestrial_classes)).to_numpy(), dtype=torch.bool),
    }
    if HEAD_PATH.is_file():
        try:
            checkpoint = torch.load(HEAD_PATH, map_location="cpu", weights_only=True)
            if checkpoint.get("model_name") != MODEL_NAME:
                raise ValueError("L’artefact a été entraîné avec une autre version de BioCLIP.")
            class_names = checkpoint["class_names"]
            class_groups = checkpoint["class_groups"]
            weights = checkpoint["weights"].float()
            bias = checkpoint["bias"].float()
            label_indices = {
                str(name).strip().casefold(): index
                for index, name in enumerate(labels["species"])
                if name is not None and str(name).strip() and str(name).strip().casefold() != "nan"
            }
            mapped_indices = [label_indices.get(str(name).strip().casefold(), -1) for name in class_names]
            if len(class_names) < 2 or len(class_names) != len(class_groups) or any(index < 0 for index in mapped_indices):
                raise ValueError("Les espèces de la tête ne correspondent pas au catalogue BioCLIP chargé.")
            if weights.ndim != 2 or weights.shape[0] != len(class_names) or bias.shape != (len(class_names),):
                raise ValueError("Dimensions de la tête BioCLIP invalides.")
            trained_head = {
                "class_names": class_names,
                "class_groups": class_groups,
                "label_indices": torch.as_tensor(mapped_indices, dtype=torch.long),
                "weights": weights,
                "bias": bias,
                "min_confidence": float(checkpoint.get("min_confidence", 1.1)),
                "validation_accuracy": float(checkpoint.get("validation_accuracy", 0.0)),
            }
            print(f"Loaded TERRA trained head: {len(class_names)} species; validation accuracy {trained_head['validation_accuracy']:.3f}", flush=True)
        except Exception as error:
            trained_head = None
            print(f"TERRA trained head unavailable; using base BioCLIP: {error}", flush=True)


@app.get("/health")
def health():
    return {
        "status": "ok" if classifier is not None else "starting",
        "model": "BioCLIP",
        "trainedHeadLoaded": trained_head is not None,
        "trainedSpeciesCount": len(trained_head["class_names"]) if trained_head else 0,
        "validationAccuracy": trained_head["validation_accuracy"] if trained_head else None,
    }


@app.post("/identify")
async def identify(
    image: UploadFile = File(...),
    group: str = Query("animals", pattern="^(plants|insects|animals|fish|all)$"),
):
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Utilisez une image JPEG, PNG ou WebP.")
    data = await image.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="L’image dépasse 10 Mo.")
    try:
        with Image.open(io.BytesIO(data)) as opened:
            source = ImageOps.exif_transpose(opened).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Image illisible.") from None

    if classifier is None:
        raise HTTPException(status_code=503, detail="BioCLIP est en cours de chargement.")

    used_trained_head = False
    try:
        with inference_lock, torch.inference_mode():
            image_features = classifier.create_image_features_for_image(source, normalize=True)
            predictions: list[dict[str, Any]] = []
            if trained_head is not None:
                allowed_groups = {
                    "plants": {"plants"},
                    "insects": {"insects"},
                    "animals": {"animals"},
                    "fish": {"fish"},
                    "all": {"plants", "insects", "animals", "fish", "fungi", "other"},
                }[group]
                allowed_positions = [index for index, class_group in enumerate(trained_head["class_groups"]) if class_group in allowed_groups]
                if allowed_positions and image_features.numel() == trained_head["weights"].shape[1]:
                    head_positions = torch.as_tensor(allowed_positions, dtype=torch.long)
                    logits = torch.nn.functional.linear(
                        image_features.flatten().unsqueeze(0),
                        trained_head["weights"][head_positions],
                        trained_head["bias"][head_positions],
                    )[0]
                    head_probabilities = torch.softmax(logits, dim=0)
                    scores, positions = torch.topk(head_probabilities, k=min(5, len(allowed_positions)))
                    if float(scores[0]) >= trained_head["min_confidence"]:
                        label_indices = trained_head["label_indices"][head_positions]
                        for score, position in zip(scores.tolist(), positions.tolist()):
                            details = classifier.get_classification_dict(int(label_indices[position]), Rank.SPECIES)
                            predictions.append({**details, "score": score})
                        used_trained_head = True

            if not predictions:
                probabilities = classifier.create_probabilities(image_features.unsqueeze(0), classifier.txt_embeddings)[0].cpu()
                if group in taxa_masks:
                    valid_indices = torch.nonzero(taxa_masks[group], as_tuple=False).flatten()
                    group_probabilities = probabilities[valid_indices]
                else:
                    valid_indices = torch.arange(probabilities.shape[0])
                    group_probabilities = probabilities
                scores, positions = torch.topk(group_probabilities, k=min(5, group_probabilities.shape[0]))
                for score, position in zip(scores.tolist(), positions.tolist()):
                    details = classifier.get_classification_dict(int(valid_indices[position]), Rank.SPECIES)
                    predictions.append({**details, "score": score})
    except Exception as error:
        print(f"BioCLIP inference failed: {error}", flush=True)
        raise HTTPException(status_code=503, detail="L’analyse BioCLIP a échoué. Réessayez dans un instant.") from None

    candidates = []
    for item in predictions:
        scientific_name = str(item.get("species", "")).strip()
        if not scientific_name:
            continue
        candidates.append({
            "scientific_name": scientific_name,
            "common_name": str(item.get("common_name", "") or "").strip(),
            "probability": max(0.0, min(1.0, float(item.get("score", 0.0)))),
            "taxonomy": {key: item.get(key) for key in ("kingdom", "phylum", "class", "order", "family", "genus", "species") if item.get(key)},
        })
        if len(candidates) == 5:
            break
    provider = "BioCLIP + TERRA" if used_trained_head else "BioCLIP"
    return {"provider": provider, "model": MODEL_NAME, "candidates": candidates}
