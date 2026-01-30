import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Neural API Gateway"
    VERSION: str = "2.0.0"
    
    # Gateway Configuration
    API_PREFIX: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_neural_key_change_in_prod")
    ALGORITHM: str = "HS256"
    
    # Service Discovery (Internal Docker Network URLs)
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://auth_service:8002")
    CORTEX_URL: str = os.getenv("CORTEX_URL", "http://cortex:8000")
    INFO_SERVICE_URL: str = os.getenv("CORTEX_URL", "http://info_service:8007")
    
    # Direct access to specific specialized services if needed (optional via Gateway)
    # Usually, we route everything smart through Cortex.
    
    class Config:
        env_file = ".env"

settings = Settings()