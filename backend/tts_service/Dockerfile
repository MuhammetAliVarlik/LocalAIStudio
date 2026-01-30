# Use a slim Python image for smaller footprint
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for audio processing
# espeak-ng: Required for phonemization
# libsndfile1: Required for soundfile library
RUN apt-get update && apt-get install -y \
    espeak-ng \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create a directory for persistent model storage
# This will be mounted as a volume via docker-compose
RUN mkdir -p /opt/neural_models

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose port (Internal use)
EXPOSE 8001

# Start the service
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]