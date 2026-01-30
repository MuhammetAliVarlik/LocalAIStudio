import os

class Settings:
    PROJECT_NAME: str = "Neural LLM Service"
    
    # Ollama Connection
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_URL", "http://ollama:11434")
    DEFAULT_MODEL: str = "llama3.2" # veya llama3.1:8b, mistral vb.
    
    # Generation Config
    TEMPERATURE: float = 0.7
    MAX_TOKENS: int = 2048

settings = Settings()