import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from engine import stt_engine
from schemas import TranscriptionResponse
from config import settings

app = FastAPI(title="Neural STT Service", version="1.0.0")

@app.on_event("startup")
def startup_event():
    # Uygulama başlarken modeli GPU'ya yükle
    stt_engine.load_model()

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Accepts audio file (wav, mp3, m4a, webm), runs Faster-Whisper, 
    and returns text with timestamps.
    """
    temp_filename = f"temp_{file.filename}"
    
    try:
        # 1. Dosyayı diske kaydet (Faster-Whisper path ister)
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Transcribe
        result = stt_engine.transcribe(temp_filename)

        # 3. Format Response (Schema'ya uygun hale getir)
        formatted_segments = []
        for s in result["segments"]:
            words = []
            if s.words:
                words = [{"word": w.word, "start": w.start, "end": w.end, "probability": w.probability} for w in s.words]
            
            formatted_segments.append({
                "id": s.id,
                "seek": s.seek,
                "start": s.start,
                "end": s.end,
                "text": s.text.strip(),
                "words": words
            })

        return {
            "text": result["text"],
            "language": result["language"],
            "language_probability": result["language_probability"],
            "duration": result["duration"],
            "segments": formatted_segments
        }

    except Exception as e:
        print(f"❌ STT Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # 4. Cleanup (Temp dosyasını sil)
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

@app.get("/health")
def health_check():
    return {
        "status": "active", 
        "model": settings.MODEL_SIZE, 
        "device": settings.DEVICE,
        "vad_enabled": settings.VAD_FILTER
    }