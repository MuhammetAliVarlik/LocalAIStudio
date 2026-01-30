import os
import torch

class Settings:
    PROJECT_NAME: str = "Neural STT Service"
    
    # Model Configuration
    # Options: tiny, base, small, medium, large-v3
    MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "medium") 
    
    # Path inside container
    MODEL_PATH: str = "/opt/whisper_models"
    
    # Compute Configuration
    # GPU varsa "cuda", yoksa "cpu"
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"
    # GPU varsa float16, CPU ise int8 kullan (Hız optimizasyonu)
    COMPUTE_TYPE: str = "float16" if torch.cuda.is_available() else "int8"
    
    # Voice Activity Detection (Sessizlik filtresi)
    VAD_FILTER: bool = True
    MIN_SILENCE_DURATION_MS: int = 500

settings = Settings()