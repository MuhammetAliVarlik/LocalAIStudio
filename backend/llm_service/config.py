import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Neural LLM Service"
    VERSION: str = "2.1.0"
    
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    
    # Using Llama 3.2 1B (High speed, Low VRAM)
    DEFAULT_MODEL: str = "llama3.2:1b"
    
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    GENERATION_TIMEOUT: int = 45

settings = Settings()