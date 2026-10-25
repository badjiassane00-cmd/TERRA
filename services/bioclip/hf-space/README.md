# TERRA BioCLIP ZeroGPU Space

This directory contains the Gradio entry point for the free Hugging Face ZeroGPU option.

## Create the Space

1. Create a **public Gradio Space** on a personal Hugging Face account that is eligible for ZeroGPU (verified email and account older than 30 days).
2. Select **ZeroGPU** as its hardware in Space settings.
3. Copy `services/bioclip/app.py` from this repository into the Space as `bioclip_service.py`.
4. Copy this directory's `app.py`, `README.md`, and `requirements.txt` to the Space root.
5. If using the TERRA-trained head, copy `services/bioclip/models/terra-bioclip-head.pt` into the Space as `models/terra-bioclip-head.pt`.
6. Set the Space secret `TERRA_API_KEY` to a long random value. Set the same value as Render's `BIOCLIP_API_KEY`.
7. Create a Hugging Face read token and set it as Render's `HF_TOKEN` secret. The token stays server-side; authenticated calls consume the account's daily ZeroGPU quota.
8. Set Render's `BIOCLIP_API_URL` to `https://<account>-<space-name>.hf.space`.

The Space source is public, so do not put tokens in its files. The API key protects prediction requests; the model and code themselves are public.

## Free-tier limit

Hugging Face currently allows an eligible free personal account to host up to two ZeroGPU Spaces. Its included quota is 5 minutes of GPU execution per day, shared at account level. Queueing and availability are best effort. This is suitable for a prototype or light use, not a guaranteed always-available production service. Recheck Hugging Face's current ZeroGPU terms before relying on it.
