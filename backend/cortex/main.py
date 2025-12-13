import os
import json
import requests
import soundfile as sf
import io
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from kokoro_onnx import Kokoro

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Initialize Kokoro ONNX ---
kokoro = None
try:
    # Ensure these paths match your Docker volume mapping
    kokoro = Kokoro("/app/models/kokoro-v0_19.onnx", "/app/models/voices.bin")
    print("✅ Loaded Kokoro ONNX successfully!")
except Exception as e:
    print(f"❌ Failed to load Kokoro: {e}")

# --- Models ---
class ChatRequest(BaseModel):
    message: str
    model: str = "llama3.2:1b"

class TTSRequest(BaseModel):
    text: str
    voice: str = "af_sarah"

class ArchitectRequest(BaseModel):
    prompt: str
    model: str = "llama3.2:1b"

# --- 1. CHAT ENDPOINT ---
@app.post("/api/chat")
async def chat(request: ChatRequest):
    ollama_url = os.getenv("OLLAMA_URL", "http://ollama:11434/api/generate")
    
    payload = {
        "model": request.model,
        "prompt": request.message,
        "system": "You are a concise voice assistant. Answer in 1 sentence. No markdown.",
        "stream": True
    }

    def iter_ollama():
        try:
            with requests.post(ollama_url, json=payload, stream=True) as response:
                if response.status_code != 200:
                    yield f"Error: {response.text}"
                    return
                for line in response.iter_lines():
                    if line:
                        data = json.loads(line)
                        yield data.get("response", "")
        except Exception as e:
            yield f"[Error: {str(e)}]"

    return StreamingResponse(iter_ollama(), media_type="text/plain")

# --- 2. TTS ENDPOINT ---
@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    if not kokoro:
        return Response(status_code=500, content="TTS Model not loaded")

    try:
        # Generate audio using Kokoro
        samples, sample_rate = kokoro.create(
            request.text, 
            voice=request.voice, 
            speed=1.0, 
            lang="en-us"
        )
        # Convert to WAV in-memory
        buffer = io.BytesIO()
        sf.write(buffer, samples, sample_rate, format='WAV')
        buffer.seek(0)
        return Response(content=buffer.read(), media_type="audio/wav")
    except Exception as e:
        return Response(status_code=500, content=str(e))

# --- 3. ARCHITECT ENDPOINT (FIXED WITH EXAMPLES) ---
@app.post("/api/architect")
async def architect_mode(request: ArchitectRequest):
    ollama_url = os.getenv("OLLAMA_URL", "http://ollama:11434/api/generate")
    
    # --- FEW-SHOT TRAINING ---
    # We teach the AI the math for Heart, DNA, and Galaxy right here.
    system_prompt = (
        "You are a Javascript 3D Math Engine. "
        "You write the math for a SINGLE particle (index 'i'). "
        "Variables available: i (index 0-800), count (800), time (seconds). "
        "Output ONLY the code body ending with a return object. "
        "\n\n"
        "--- EXAMPLE: HEART ---\n"
        "User: Make a red heart\n"
        "Code: const t = (i/count) * Math.PI * 2; const x = 16 * Math.pow(Math.sin(t), 3); const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t); return { x: x*0.1, y: y*0.1, z: 0, color: '#ff0000' };\n"
        "\n"
        "--- EXAMPLE: DNA ---\n"
        "User: Create a DNA helix\n"
        "Code: const angle = (i/count) * Math.PI * 10 + time; const radius = 1.5; const strand = i % 2 === 0 ? 0 : Math.PI; return { x: Math.cos(angle + strand) * radius, y: (i/count)*6 - 3, z: Math.sin(angle + strand) * radius, color: i%2===0 ? '#00ffff' : '#ff00ff' };\n"
        "\n"
        "--- EXAMPLE: GALAXY ---\n"
        "User: Make a swirling galaxy\n"
        "Code: const angle = time + (i/count) * 10; const r = (i/count) * 4; return { x: Math.cos(angle) * r, y: Math.sin(time + i*0.1) * 0.2, z: Math.sin(angle) * r, color: '#88ccff' };\n"
        "\n"
        "--- EXAMPLE: WAVE (BOOK) ---\n"
        "User: Make a flowing book or page\n"
        "Code: const x = (i/count) * 6 - 3; const y = Math.sin(x + time) * 0.5; return { x: x, y: y, z: 0, color: '#ffffff' };\n"
        "----------------\n"
    )

    payload = {
        "model": request.model,
        "prompt": f"User: {request.prompt}\nCode:", 
        "system": system_prompt,
        "stream": False,
        "options": { 
            "temperature": 0.1,  # Strict mode
            "stop": ["User:", "---", "```"] 
        }
    }

    try:
        response = requests.post(ollama_url, json=payload)
        raw_code = response.json().get("response", "").strip()
        
        # Cleanup
        clean_code = raw_code.replace("```javascript", "").replace("```", "").strip()
        
        # Safety Fallback
        if "return" not in clean_code:
             clean_code = "const t = time + i*0.1; return { x: Math.cos(t), y: Math.sin(t), z: 0, color: '#ffffff' };"

        print(f"Architect Generated: {clean_code[:100]}...") 
        return {"code": clean_code}
    except Exception as e:
        return Response(status_code=500, content=str(e))