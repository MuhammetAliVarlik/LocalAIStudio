# backend/cortex/config.py
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Central configuration for the Cortex Orchestrator.
    Defines connection strings for all peripheral nervous system services.
    """
    PROJECT_NAME: str = "Neural OS Cortex"
    VERSION: str = "2.0.0"

    # --- PATH CONFIGURATION (NEW) ---
    # Projenin kök dizinini dinamik olarak buluyoruz
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Personas klasörünü data/personas altında tutuyoruz
    # Docker volume ile burayı kalıcı hale getireceğiz
    PERSONAS_DIR: str = os.getenv("PERSONAS_DIR", os.path.join(BASE_DIR, "data", "personas"))

    # Vector Memory (Qdrant)
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5" # Efficient & High Performance
    COLLECTION_NAME: str = "neural_memory"

    # Microservice Endpoints (Service Discovery)
    # Varsayılan değerler docker-compose servis isimlerine göre ayarlandı
    LLM_SERVICE_URL: str = os.getenv("LLM_SERVICE_URL", "http://llm_service:8004") 
    TTS_SERVICE_URL: str = os.getenv("TTS_SERVICE_URL", "http://tts_service:8001")
    STT_SERVICE_URL: str = os.getenv("STT_SERVICE_URL", "http://stt_service:8003")
    FINANCE_SERVICE_URL: str = os.getenv("FINANCE_SERVICE_URL", "http://finance_service:8006")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    def _create_dirs(self):
        """Ensure critical directories exist on startup."""
        os.makedirs(self.PERSONAS_DIR, exist_ok=True)

settings = Settings()
settings._create_dirs() # Klasörlerin varlığından emin ol