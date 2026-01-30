import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Central configuration for the Cortex Orchestrator.
    Defines connection strings for all peripheral nervous system services.
    """
    PROJECT_NAME: str = "Neural OS Cortex"
    VERSION: str = "2.0.0"
    
    # Vector Memory (Qdrant)
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5" # Efficient & High Performance
    COLLECTION_NAME: str = "neural_memory"

    # Microservice Endpoints (Service Discovery)
    LLM_SERVICE_URL: str = os.getenv("LLM_SERVICE_URL", "http://localhost:8004")
    TTS_SERVICE_URL: str = os.getenv("TTS_SERVICE_URL", "http://localhost:8001")
    STT_SERVICE_URL: str = os.getenv("STT_SERVICE_URL", "http://localhost:8003")
    FINANCE_SERVICE_URL: str = os.getenv("FINANCE_SERVICE_URL", "http://localhost:8006")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

settings = Settings()