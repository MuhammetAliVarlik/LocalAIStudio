FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# FIX: Run on port 8000 to match docker-compose mapping (8007:8000)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]