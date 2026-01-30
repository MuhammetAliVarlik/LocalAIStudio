import os

class Settings:
    PROJECT_NAME: str = "Neural TTS Service"
    VERSION: str = "1.0.0"
    
    # Model Configuration
    # Models are stored in /opt/neural_models which is a persistent Docker volume
    MODEL_DIR: str = os.getenv("MODEL_DIR", "/opt/neural_models")
    
    # Checkpoints (Kokoro v0.19)
    MODEL_PATH: str = os.path.join(MODEL_DIR, "kokoro-v0_19.onnx")
    VOICES_PATH: str = os.path.join(MODEL_DIR, "voices.bin")
    
    # Download URLs (Official Release)
    MODEL_URL: str = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/kokoro-v0_19.onnx"
    VOICES_URL: str = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/voices.bin"
    
    # Default Voice
    DEFAULT_VOICE: str = "af_sarah"
    DEFAULT_SPEED: float = 1.0
    DEFAULT_LANG: str = "en-us"

settings = Settings()