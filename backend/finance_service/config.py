import os
from pydantic import BaseSettings

class Settings(BaseSettings):
    """
    Central configuration for the Finance Service.
    """
    PROJECT_NAME: str = "Neural Finance Service"
    VERSION: str = "1.1.0" # Polars Optimized
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./finance.db")
    
    # Redis Cache
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # Market Data Settings
    CACHE_EXPIRY_SECONDS: int = 60  # Cache prices for 1 minute
    DEFAULT_CURRENCY: str = "USD"

settings = Settings()