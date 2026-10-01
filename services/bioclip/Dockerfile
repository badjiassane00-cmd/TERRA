FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/models/huggingface \
    TOKENIZERS_PARALLELISM=false

WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
      torch==2.13.0 torchvision==0.28.0 \
    && pip install --no-cache-dir -r requirements.txt
COPY app.py ./app.py
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
