FROM python:3.11-slim

WORKDIR /app

# Install basic system deps (curl for healthchecks)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Gateway runs on the public port 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]