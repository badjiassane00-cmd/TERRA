FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MODEL_REVISION=d4950a256ec1ad2265a0e2cb072f6aed49c1fc5a
WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
      torch==2.13.0 torchvision==0.28.0 \
    && pip install --no-cache-dir -r requirements.txt
COPY app.py model.py class_names.py download_model.py ./
RUN python download_model.py
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
