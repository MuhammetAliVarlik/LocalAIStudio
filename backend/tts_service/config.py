import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Neural TTS Service"
    VERSION: str = "2.0.0"
    
    MODEL_PATH: str = os.getenv("MODEL_PATH", "/opt/neural_models/kokoro-v0_19.onnx")
    VOICES_PATH: str = os.getenv("VOICES_PATH", "/opt/neural_models/voices.json")
    
    SAMPLE_RATE: int = 24000
    DEFAULT_VOICE: str = "af_sarah"
    
    # CRITICAL: Force CPU. Kokoro is very fast on CPU.
    # Saving GPU for LLM and STT is priority.
    DEVICE: str = "cpu" 

settings = Settings()