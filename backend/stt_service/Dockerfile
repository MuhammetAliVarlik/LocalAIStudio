FROM python:3.11-slim

WORKDIR /app

# 1. Install System Dependencies (FFMPEG is critical for audio conversion)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Create Persistent Model Directory
RUN mkdir -p /opt/whisper_models

# 3. Install Python Deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run on port 8003
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]