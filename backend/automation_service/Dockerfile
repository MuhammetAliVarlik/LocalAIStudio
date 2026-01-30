# Use a lightweight Python base image to reduce RAM usage and image size
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (if any are needed for specific libs like numpy/pandas later)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to leverage Docker cache layering
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port for the FastAPI app
EXPOSE 8005

# Default command to run the API (Worker overrides this in docker-compose)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8005"]