import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Neural OS Gateway"
    
    # Service URLs (Docker Network Internal Names)
    # Eğer .env dosyasında bunlar tanımlıysa oradan alır, yoksa default'u kullanır.
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://auth_service:8002")
    STT_SERVICE_URL: str = os.getenv("STT_SERVICE_URL", "http://stt_service:8003")
    LLM_SERVICE_URL: str = os.getenv("LLM_SERVICE_URL", "http://llm_service:8004")
    TTS_SERVICE_URL: str = os.getenv("TTS_SERVICE_URL", "http://tts_service:8001")
    FINANCE_SERVICE_URL: str = os.getenv("FINANCE_SERVICE_URL", "http://finance_service:8005")
    INFO_SERVICE_URL: str = os.getenv("INFO_SERVICE_URL", "http://info_service:8006")
    AUTOMATION_SERVICE_URL: str = os.getenv("AUTOMATION_SERVICE_URL", "http://automation_service:8007")
    
settings = Settings()