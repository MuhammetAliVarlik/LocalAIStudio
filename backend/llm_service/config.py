import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """
    PROJECT_NAME: str = "Neural LLM Service"
    VERSION: str = "2.0.0"
    
    # Ollama Configuration
    OLLAMA_URL: str = os.getenv("OLLAMA_URL", "http://localhost:11434")
    DEFAULT_MODEL: str = "llama3"
    
    # Redis Configuration (For Conversation Memory)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Timeout settings
    GENERATION_TIMEOUT: int = 60 # seconds

settings = Settings()