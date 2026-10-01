import io
import os
from pathlib import Path

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from torchvision import transforms

from class_names import CLASSES
from model import EfficientNetB4Classifier

MODEL_PATH = Path(os.getenv("MODEL_PATH", "/app/models/best_model.pth"))
MAX_IMAGE_BYTES = 10 * 1024 * 1024
app = FastAPI(title="TERRA PlantVillage classifier", docs_url=None, redoc_url=None)
model = None
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


@app.on_event("startup")
def load_model():
    global model
    if not MODEL_PATH.is_file():
        raise RuntimeError("PlantVillage model weights are missing")
    checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=True)
    state = checkpoint.get("model_state_dict", checkpoint)
    classifier = EfficientNetB4Classifier(num_classes=len(CLASSES), dropout=0.4)
    classifier.load_state_dict(state, strict=True)
    classifier.eval()
    model = classifier
    torch.set_num_threads(max(1, min(4, os.cpu_count() or 1)))


@app.get("/health")
def health():
    return {"status": "ok" if model is not None else "starting", "model": "plantvillage-efficientnet-b4"}


@app.post("/identify")
async def identify(image: UploadFile = File(...)):
    if image.content_type not in {"image/jpeg", "image/png", "image/webp"}:
        raise HTTPException(status_code=415, detail="Use JPEG, PNG ou WebP.")
    data = await image.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="L’image dépasse 10 Mo.")
    try:
        with Image.open(io.BytesIO(data)) as opened:
            source = ImageOps.exif_transpose(opened).convert("RGB")
            tensor = preprocess(source).unsqueeze(0)
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Image illisible.") from None

    if model is None:
        raise HTTPException(status_code=503, detail="Le modèle est en cours de chargement.")
    with torch.inference_mode():
        probabilities = torch.softmax(model(tensor)[0], dim=0)
        scores, indices = torch.topk(probabilities, k=min(5, len(CLASSES)))
    return {
        "provider": "PlantVillage EfficientNet-B4",
        "modelLicense": "MIT",
        "candidates": [
            {"className": CLASSES[index], "score": float(score)}
            for score, index in zip(scores.tolist(), indices.tolist())
        ],
    }
