import os

# --- PATHS ---
WORKSPACE_DIR = os.getenv("WORKSPACE_DIR", "/app/workspace")
MEMORY_DIR = os.path.join(WORKSPACE_DIR, "memory_db")
PERSONAS_DIR = os.path.join(WORKSPACE_DIR, "personas") 

# --- AI CONFIG ---
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MODEL_NAME = "llama3.2:1b"

# TTS Model Paths: Pointing to /opt to align with Docker volume isolation strategy
TTS_MODEL_PATH = "/opt/neural_models/kokoro-v0_19.onnx"
TTS_VOICES_PATH = "/opt/neural_models/voices.bin"

# --- SECURITY ---
# TODO: Move SECRET_KEY to environment variables for production
SECRET_KEY = "super-secret-neural-key-change-this-in-prod"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# --- INIT ---
# Ensure required directories exist
if not os.path.exists(WORKSPACE_DIR):
    os.makedirs(WORKSPACE_DIR)

if not os.path.exists(PERSONAS_DIR):
    os.makedirs(PERSONAS_DIR)