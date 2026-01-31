import os
import torch

class Settings:
    PROJECT_NAME: str = "Neural STT Service"
    
    # Model Configuration
    # 'small' is safer for 4GB VRAM alongside Llama 1B. 
    # 'medium' uses ~1.5GB which is risky.
    MODEL_SIZE: str = os.getenv("WHISPER_MODEL_SIZE", "small") 
    MODEL_PATH: str = "/opt/whisper_models"
    
    # Compute Configuration
    DEVICE: str = "cuda" if torch.cuda.is_available() else "cpu"
    # GTX 1650 Ti supports float16
    COMPUTE_TYPE: str = "float16" if torch.cuda.is_available() else "int8"
    
    # VAD Filter
    VAD_FILTER: bool = True
    MIN_SILENCE_DURATION_MS: int = 300

settings = Settings()