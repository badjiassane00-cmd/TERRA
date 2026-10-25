import hmac
import os
import gradio as gr
import spaces
import torch
from fastapi import HTTPException
from PIL import Image, ImageOps, UnidentifiedImageError

from bioclip_service import identify_image, load_classifier

API_KEY = os.environ.get("TERRA_API_KEY", "")
MAX_IMAGE_BYTES = 10 * 1024 * 1024

# ZeroGPU emulates CUDA during startup so model weights can be cached on the
# accelerator before a request consumes the account's daily GPU quota.
torch.set_num_threads(2)
load_classifier(device="cuda")


@spaces.GPU(duration=30)
def identify(image_path: str, group: str, request: gr.Request):
    supplied_key = request.headers.get("x-terra-api-key", "") if request else ""
    if not API_KEY or not hmac.compare_digest(supplied_key, API_KEY):
        raise gr.Error("Unauthorized")
    if not image_path:
        raise gr.Error("Image manquante.")
    path = Path(image_path)
    if path.stat().st_size > MAX_IMAGE_BYTES:
        raise gr.Error("L’image dépasse 10 Mo.")
    try:
        with Image.open(path) as opened:
            source = ImageOps.exif_transpose(opened).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise gr.Error("Image illisible.") from None
    try:
        return identify_image(source, group)
    except HTTPException as error:
        raise gr.Error(str(error.detail)) from None


demo = gr.Interface(
    fn=identify,
    inputs=[gr.Image(type="filepath", label="Image"), gr.Dropdown(
        choices=["plants", "insects", "animals", "fish", "all"],
        value="animals",
        label="Groupe",
    )],
    outputs=gr.JSON(label="Identification"),
    api_name="identify",
    title="TERRA BioCLIP API",
    description="Service d’identification BioCLIP pour TERRA.",
)

demo.launch()
