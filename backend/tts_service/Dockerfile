# Use slim python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
# 'libsndfile1' is required by soundfile/pysoundfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install python packages
RUN pip install --no-cache-dir -r requirements.txt

# Create directory for models
RUN mkdir -p /opt/neural_models

# Copy app code
COPY . .

# Expose port
EXPOSE 8001

# Run command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]