from pydantic import BaseModel, Field
from typing import Optional, List, Dict

class ChatRequest(BaseModel):
    message: str
    model: Optional[str] = None
    persona_system_prompt: Optional[str] = "You are a helpful AI assistant."
    conversation_id: Optional[str] = "default" # Hafıza için
    stream: bool = True

class ChatResponse(BaseModel):
    response: str
    model_used: str