from fastapi import APIRouter, Response
import io
import soundfile as sf
from schemas import TTSRequest
from services.tts_engine import get_kokoro

router = APIRouter()

@router.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    engine = get_kokoro()
    if not engine: return Response(status_code=500)
    try:
        voice_to_use = request.voice if request.voice else "af_sarah"
        samples, sample_rate = engine.create(request.text, voice=voice_to_use, speed=1.0, lang="en-us")
        buffer = io.BytesIO()
        sf.write(buffer, samples, sample_rate, format='WAV')
        buffer.seek(0)
        return Response(content=buffer.read(), media_type="audio/wav")
    except Exception as e: return Response(status_code=500, content=str(e))