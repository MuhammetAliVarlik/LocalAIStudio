import os

class Settings:
    PROJECT_NAME: str = "Neural Auth Service"
    VERSION: str = "1.0.0"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change_this_in_production_to_a_long_random_string")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    WORKSPACE_DIR = os.getenv("WORKSPACE_DIR", "/app/workspace")
    DATABASE_URL = f"sqlite:///{os.path.join(WORKSPACE_DIR, 'auth.db')}"

settings = Settings()