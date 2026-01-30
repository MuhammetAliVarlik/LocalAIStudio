# backend/cortex/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

# --- Chat Interaction ---
class ChatRequest(BaseModel):
    """
    Standard request model for chat interactions.
    """
    message: str = Field(..., description="The user's input message.")
    session_id: str = Field(..., description="Unique identifier for the conversation session.")
    persona_id: str = Field("nova", description="The ID of the AI persona to interact with.")
    enable_memory: bool = Field(True, description="Flag to enable/disable RAG (Retrieval-Augmented Generation).")

# --- Persona Configuration (EKSİK OLAN KISIM BURASIYDI) ---
class PersonaConfig(BaseModel):
    """
    Schema for AI Persona definitions (used by Agent Builder).
    """
    id: str = Field(..., description="Unique URL-safe identifier (e.g., 'nova')")
    name: str = Field(..., description="Display name")
    role: Optional[str] = Field("Assistant", description="Short role description")
    description: Optional[str] = None
    color: str = Field("#22d3ee", description="UI Theme color hex code")
    avatar: Optional[str] = None
    voice: Optional[str] = Field("af_sarah", description="TTS Voice ID")
    system_prompt: str = Field(..., description="The core personality instructions")
    traits: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Custom parameters")

# --- Memory Management ---
class MemoryCreate(BaseModel):
    """
    Schema for manually creating a memory entry.
    """
    text: str
    persona_id: str
    emotion: Optional[str] = "neutral"
    label: Optional[str] = "manual_entry"

class MemoryUpdate(BaseModel):
    """
    Schema for updating an existing memory entry.
    """
    text: Optional[str] = None
    label: Optional[str] = None
    emotion: Optional[str] = None
    isCore: Optional[bool] = None