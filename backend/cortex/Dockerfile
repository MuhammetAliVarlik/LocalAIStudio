# Base image: Use slim variant for reduced footprint
FROM python:3.11-slim

WORKDIR /app

# System dependencies: Install required libs and clean up to reduce layer size
RUN apt-get update && apt-get install -y \
    espeak-ng \
    libsndfile1 \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Model Acquisition: Download to /opt to prevent volume mount overrides during dev
# Using /opt/neural_models ensures models persist even when ./backend/cortex is mounted to /app
RUN mkdir -p /opt/neural_models
RUN curl -L -o /opt/neural_models/kokoro-v0_19.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/kokoro-v0_19.onnx
RUN curl -L -o /opt/neural_models/voices.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/voices.bin

# Python Dependencies: Copy and install requirements before source to leverage Docker cache
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Source Code: Copy remaining application files
COPY . .

# Entrypoint: Start uvicorn with hot-reload enabled for development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]