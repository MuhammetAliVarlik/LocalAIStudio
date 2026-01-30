# Use python slim image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (Polars might need some build tools depending on version, 
# but usually binary wheels are fine. 'build-essential' is good practice).
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create Data Directory
RUN mkdir -p /app/data

# Copy Code
COPY . .

# Expose Port
EXPOSE 8006

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8006"]