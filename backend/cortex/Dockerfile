# UPGRADE to Python 3.11 (Fixes dependency issues)
FROM python:3.11-slim

WORKDIR /app

# 1. Install System Dependencies
# libsndfile1 is required for soundfile
# espeak-ng is required for phonemizer
RUN apt-get update && apt-get install -y \
    espeak-ng-data \
    espeak-ng \
    libsndfile1 \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# 2. Upgrade pip
RUN pip install --upgrade pip

# 3. Install Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Download Models (SWITCHED TO voices.bin)
RUN mkdir -p /app/models
RUN wget -O /app/models/kokoro-v0_19.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/kokoro-v0_19.onnx && \
    wget -O /app/models/voices.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/voices.bin

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]