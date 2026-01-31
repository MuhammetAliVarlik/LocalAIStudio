FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
# wget added to download models; espeak-ng is the phonemizer backend
 RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    espeak-ng \
    wget \
    && rm -rf /var/lib/apt/lists/*

# --- FIX: Force usage of system espeak-ng to avoid 'phontab' errors ---
# This overrides the broken bundled version in espeakng-loader
ENV PHONEMIZER_ESPEAK_LIBRARY=/usr/lib/x86_64-linux-gnu/libespeak-ng.so.1
ENV PHONEMIZER_ESPEAK_DATA=/usr/lib/x86_64-linux-gnu/espeak-ng-data

COPY requirements.txt .
 RUN pip install --no-cache-dir -r requirements.txt

# Create and pre-populate the models directory
RUN mkdir -p /opt/neural_models

# Download Kokoro ONNX Model (v1.0)
RUN wget https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx \
    -O /opt/neural_models/kokoro-v1.0.onnx

# Download Voices Binary (v1.0)
RUN wget https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin \
    -O /opt/neural_models/voices-v1.0.bin

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]