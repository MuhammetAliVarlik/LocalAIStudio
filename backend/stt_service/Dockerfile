# Use python:3.11-slim for a smaller image footprint
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Install system dependencies.
# 'ffmpeg' is strictly required by faster-whisper/audio processing.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file first to leverage Docker layer caching
COPY requirements.txt .

# Install Python dependencies without caching to save space
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 8003 for the API service
EXPOSE 8003

# Default command runs the API.
# Note: The 'stt_worker' service in docker-compose overrides this 
# to run the 'celery' command instead.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003"]