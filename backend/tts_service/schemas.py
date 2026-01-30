from pydantic import BaseModel, Field

class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize", min_length=1)
    voice: str = Field(default="af_sarah", description="Voice ID (e.g., af_sarah, am_adam)")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed")
    lang: str = Field(default="en-us", description="Language code")

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    available_voices: int