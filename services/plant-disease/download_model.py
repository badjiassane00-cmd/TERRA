import os
from huggingface_hub import hf_hub_download

hf_hub_download(
    repo_id="Khawajaa/plant-disease-detector",
    filename="best_model.pth",
    revision=os.environ.get("MODEL_REVISION", "d4950a256ec1ad2265a0e2cb072f6aed49c1fc5a"),
    local_dir="/app/models",
)
