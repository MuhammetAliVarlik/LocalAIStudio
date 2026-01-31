import json
import logging
import asyncio
import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from config import settings

# Configure Logger
logger = logging.getLogger("Cortex_Chat")

router = APIRouter()

# --- VOICE MAP ---
# Maps persona IDs to Kokoro voice codes
# You can add more mappings here as needed
PERSONA_VOICE_MAP = {
    "default": "af_sarah",   # Default Female
    "nova": "af_sarah",
    "sage": "am_michael",    # Example Male
    "cipher": "bf_emma",
    "architect": "am_adam"
}

# --- SERVICES ---

async def query_llm_stream(message: str, session_id: str):
    """
    Generator that yields chunks of text from the LLM Service.
    """
    async with httpx.AsyncClient(timeout=45.0) as client:
        # LLM servisine streaming request atıyoruz
        async with client.stream(
            "POST", 
            f"{settings.LLM_SERVICE_URL}/chat", 
            json={"message": message, "conversation_id": session_id, "stream": True}
        ) as response:
            async for chunk in response.aiter_lines():
                if chunk:
                    # SSE format: "data: {...}" parsing
                    if chunk.startswith("data: "):
                        data_str = chunk.replace("data: ", "").strip()
                        if data_str == "[DONE]":
                            break
                        try:
                            data = json.loads(data_str)
                            if "content" in data:
                                yield data["content"]
                        except:
                            pass

# FIX: Added 'voice' parameter here.
# The TTS Service requires 'voice' to know which speaker embedding to use.
async def generate_tts(text: str, voice: str):
    """
    Fetches audio bytes from TTS Service for a given text fragment.
    """
    if not text or len(text.strip()) < 2: 
        return None
        
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.TTS_SERVICE_URL}/generate",
                # FIX: Payload now includes 'voice' and 'speed'
                json={"text": text, "voice": voice, "speed": 1.0},
            )
            if resp.status_code == 200:
                return resp.content # Binary audio data (WAV/PCM)
            else:
                logger.error(f"TTS Service returned {resp.status_code}: {resp.text}")
    except Exception as e:
        logger.error(f"TTS Connection Error: {e}")
    return None

# --- WEBSOCKET ENDPOINT ---

@router.websocket("/ws/chat/{session_id}")
async def websocket_chat(websocket: WebSocket, session_id: str, persona_id: str = Query("default")):
    """
    Full-Duplex Chat Endpoint.
    Handles: Text In -> LLM Processing -> Text Out + Audio Out (Parallel)
    """
    await websocket.accept()
    logger.info(f"WS Connected: {session_id} | Persona: {persona_id}")
    
    # FIX: Select the correct voice based on the connected persona
    selected_voice = PERSONA_VOICE_MAP.get(persona_id, "af_sarah")

    try:
        while True:
            # 1. Wait for User Message
            data = await websocket.receive_json()
            
            if data.get("type") == "interrupt":
                logger.info("Interrupt signal received.")
                continue

            if data.get("type") == "user_message":
                user_text = data.get("content")
                logger.info(f"User said: {user_text}")

                # 2. Process Pipeline
                current_sentence = ""
                
                async for token in query_llm_stream(user_text, session_id):
                    if websocket.client_state.name == "DISCONNECTED":
                        break

                    # A. Stream Text to Frontend immediately
                    await websocket.send_json({
                        "type": "text_chunk",
                        "content": token
                    })
                    
                    # B. Accumulate for TTS
                    current_sentence += token
                    
                    # Split by punctuation to create natural pauses
                    if token in [".", "!", "?", "\n"]:
                        # FIX: Pass the 'selected_voice' to the generator
                        audio_bytes = await generate_tts(current_sentence, selected_voice)
                        if audio_bytes:
                            await websocket.send_bytes(audio_bytes)
                        current_sentence = "" # Reset buffer

                # Final flush if any text remains
                if current_sentence.strip():
                    audio_bytes = await generate_tts(current_sentence, selected_voice)
                    if audio_bytes:
                        await websocket.send_bytes(audio_bytes)

                # Signal end of turn
                await websocket.send_json({"type": "generation_end"})

    except WebSocketDisconnect:
        logger.info(f"WS Disconnected: {session_id}")
    except Exception as e:
        logger.error(f"WS Critical Error: {e}")