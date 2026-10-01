import io
import os
from threading import Lock
from typing import Any

import torch
from bioclip._constants import Rank
from bioclip.predict import TreeOfLifeClassifier
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

MAX_IMAGE_BYTES = 10 * 1024 * 1024
MODEL_NAME = os.getenv("BIOCLIP_MODEL", "hf-hub:imageomics/bioclip")
app = FastAPI(title="TERRA BioCLIP", docs_url=None, redoc_url=None)
classifier: TreeOfLifeClassifier | None = None
taxa_masks: dict[str, torch.Tensor] = {}
inference_lock = Lock()


@app.on_event("startup")
def load_classifier():
    global classifier, taxa_masks
    torch.set_num_threads(max(1, min(4, os.cpu_count() or 1)))
    classifier = TreeOfLifeClassifier(model_str=MODEL_NAME, device="cpu")
    labels = classifier.get_label_data()
    taxa_masks = {
        "insects": torch.as_tensor(labels["class"].fillna("").str.casefold().eq("insecta").to_numpy(), dtype=torch.bool),
        "animals": torch.as_tensor((labels["kingdom"].fillna("").str.casefold().eq("animalia") & ~labels["class"].fillna("").str.casefold().eq("insecta")).to_numpy(), dtype=torch.bool),
    }


@app.get("/health")
def health():
    return {"status": "ok" if classifier is not None else "starting", "model": "BioCLIP"}


@app.post("/identify")
async def identify(
    image: UploadFile = File(...),
    group: str = Query("animals", pattern="^(insects|animals|all)$"),
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

    try:
        with inference_lock, torch.inference_mode():
            image_features = classifier.create_image_features_for_image(source, normalize=True)
            probabilities = classifier.create_probabilities(image_features.unsqueeze(0), classifier.txt_embeddings)[0].cpu()
            if group in taxa_masks:
                valid_indices = torch.nonzero(taxa_masks[group], as_tuple=False).flatten()
                group_probabilities = probabilities[valid_indices]
            else:
                valid_indices = torch.arange(probabilities.shape[0])
                group_probabilities = probabilities
            scores, positions = torch.topk(group_probabilities, k=min(5, group_probabilities.shape[0]))
            predictions: list[dict[str, Any]] = []
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
    return {"provider": "BioCLIP", "model": MODEL_NAME, "candidates": candidates}
