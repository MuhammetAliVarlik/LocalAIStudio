# 1. Base Image (Full version for C++ libs)
FROM python:3.11

WORKDIR /app

# 2. Install System Dependencies (Cached)
# We group these to create a single cached layer
RUN apt-get update && apt-get install -y \
    espeak-ng \
    libsndfile1 \
    git \
    wget \
    && rm -rf /var/lib/apt/lists/*

# 3. Download AI Models (Cached)
# We do this BEFORE requirements.txt so changing a library doesn't re-download 100MB+ models
RUN mkdir -p /app/models
RUN wget -O /app/models/kokoro-v0_19.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/kokoro-v0_19.onnx
RUN wget -O /app/models/voices.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/voices.bin

# 4. Install Python Dependencies (Cached)
# Only re-runs if requirements.txt changes
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 5. Copy Source Code (Always changes last)
# This is the only step that re-runs when you edit main.py
COPY . .

# 6. Start
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]