import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Configuration management for the TTS Service.
    """
    PROJECT_NAME: str = "Neural TTS Service"
    VERSION: str = "2.0.0"
    
    # Model Paths
    MODEL_PATH: str = os.getenv("MODEL_PATH", "/opt/neural_models/kokoro-v0_19.onnx")
    VOICES_PATH: str = os.getenv("VOICES_PATH", "/opt/neural_models/voices.json")
    
    # Audio Settings
    SAMPLE_RATE: int = 24000
    DEFAULT_VOICE: str = "af_sarah"
    
    # Performance
    DEVICE: str = os.getenv("DEVICE", "cpu") # 'cuda' or 'cpu'

settings = Settings()