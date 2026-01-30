from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from engine import tts_engine
from config import settings
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TTS_Service")

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# --- Schemas ---
class TTSRequest(BaseModel):
    text: str
    voice: str = settings.DEFAULT_VOICE
    speed: float = 1.0
    stream: bool = True

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    available_voices: list

# --- Lifecycle Events ---
@app.on_event("startup")
async def startup_event():
    """Pre-load model on startup to prevent delay on first request."""
    try:
        tts_engine.initialize()
    except Exception as e:
        logger.warning(f"Startup loading failed (will retry on request): {e}")

# --- Endpoints ---
@app.get("/health", response_model=HealthResponse)
def health_check():
    """Service health check and capabilities."""
    loaded = tts_engine.kokoro is not None
    voices = tts_engine.get_voices() if loaded else []
    return {
        "status": "active",
        "model_loaded": loaded,
        "available_voices": voices
    }

@app.post("/generate")
async def generate_speech(req: TTSRequest):
    """
    Generates audio from text.
    
    Modes:
    - Stream=True: Returns 'audio/wav' chunks immediately (Low Latency).
    - Stream=False: Returns full audio file (for downloading).
    """
    try:
        if req.stream:
            return StreamingResponse(
                tts_engine.stream_audio(req.text, req.voice, req.speed),
                media_type="audio/wav"
            )
        else:
            # For non-streaming, we consume the generator and merge
            # (Simplified for this example, usually streaming is preferred)
            full_audio = b""
            for chunk in tts_engine.stream_audio(req.text, req.voice, req.speed):
                full_audio += chunk
            
            from fastapi.responses import Response
            return Response(content=full_audio, media_type="audio/wav")
    
    except Exception as e:
        logger.error(f"Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/voices")
def list_voices():
    """List available voice IDs."""
    return {"voices": tts_engine.get_voices()}