from pydantic import BaseModel
from typing import Optional, Dict, List

"""
DATA SCHEMAS
------------
Pydantic models for request/response validation.
Acts as the contract between Frontend and Backend.
"""

# --- AUTH MODELS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    """
    Schema for user registration.
    """
    username: str
    password: str
    full_name: str = "New User"

# --- CHAT & LLM MODELS ---
class ChatRequest(BaseModel):
    message: str
    model: str = "llama3.2:1b"
    persona_id: str = "nova"

class ArchitectRequest(BaseModel):
    prompt: str
    model: str = "llama3.2:1b"

class BriefingRequest(BaseModel):
    persona_id: str

# --- TTS MODELS ---
class TTSRequest(BaseModel):
    text: str
    voice: str = "af_sarah"

# --- MEMORY MODELS ---
class MemoryCreate(BaseModel):
    text: str
    label: str
    emotion: str = "neutral"
    persona_id: str = "nova"

class MemoryUpdate(BaseModel):
    text: Optional[str] = None
    label: Optional[str] = None
    emotion: Optional[str] = None
    isCore: Optional[bool] = None

# --- PERSONA CONFIG ---
class PersonaConfig(BaseModel):
    id: str
    name: str
    color: str
    voice: str = "af_sarah"
    traits: Dict
    system_prompt: str
    map_state: Dict = {}

# --- SYSTEM & FILES ---
class FileModel(BaseModel):
    name: str
    content: str
    language: str = "text"

class TerminalRequest(BaseModel):
    command: str