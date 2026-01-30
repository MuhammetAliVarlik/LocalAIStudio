from fastapi import FastAPI, HTTPException
from fastapi.responses import Response, JSONResponse
from engine import tts_engine
from schemas import TTSRequest, HealthResponse
from config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Microservice for Neural Text-to-Speech generation using Kokoro-ONNX"
)

@app.on_event("startup")
async def startup_event():
    """Initialize the TTS Engine on startup."""
    try:
        tts_engine.initialize()
    except Exception as e:
        print(f"❌ Critical Error during startup: {e}")
        # We don't exit here to allow container inspection, but service won't work

@app.get("/health", response_model=HealthResponse)
def health_check():
    """Service health check."""
    loaded = tts_engine.kokoro is not None
    return {
        "status": "active" if loaded else "initializing",
        "model_loaded": loaded,
        "available_voices": len(tts_engine.get_voices())
    }

@app.post("/generate")
async def generate_speech(req: TTSRequest):
    """
    Generates audio from text.
    Returns: audio/wav binary stream.
    """
    try:
        audio_bytes = tts_engine.generate(
            text=req.text,
            voice=req.voice,
            speed=req.speed,
            lang=req.lang
        )
        
        return Response(content=audio_bytes, media_type="audio/wav")
    
    except RuntimeError as re:
        raise HTTPException(status_code=503, detail="TTS Engine is not ready yet.")
    except Exception as e:
        print(f"Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/voices")
def list_voices():
    """List available voice IDs."""
    return {"voices": tts_engine.get_voices()}