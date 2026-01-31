import json
import logging
import asyncio
import httpx
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from config import settings

# Configure Logger
logger = logging.getLogger("Cortex_Chat")

router = APIRouter()

# --- SERVICES ---
# Internal HTTP Clients for Microservices
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

async def generate_tts(text: str):
    """
    Fetches audio bytes from TTS Service for a given text fragment.
    """
    if not text or len(text.strip()) < 2: 
        return None
        
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{settings.TTS_SERVICE_URL}/generate",
                json={"text": text},
            )
            if resp.status_code == 200:
                return resp.content # Binary audio data (WAV/PCM)
    except Exception as e:
        logger.error(f"TTS Error: {e}")
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
    
    try:
        while True:
            # 1. Wait for User Message
            # Expected JSON: { "type": "user_message", "content": "Hello" }
            data = await websocket.receive_json()
            
            if data.get("type") == "interrupt":
                # Frontend sent signal to stop current generation
                # In a complex system, we would cancel the async tasks here.
                # For now, we accept the signal and clear buffer.
                logger.info("Interrupt signal received.")
                continue

            if data.get("type") == "user_message":
                user_text = data.get("content")
                logger.info(f"User said: {user_text}")

                # 2. Process Pipeline
                # We need to accumulate tokens to form sentences for TTS, 
                # while streaming raw tokens to frontend for UI.
                current_sentence = ""
                
                async for token in query_llm_stream(user_text, session_id):
                    # Check connection state
                    if websocket.client_state.name == "DISCONNECTED":
                        break

                    # A. Stream Text to Frontend immediately
                    await websocket.send_json({
                        "type": "text_chunk",
                        "content": token
                    })
                    
                    # B. Accumulate for TTS
                    current_sentence += token
                    
                    # Simple heuristic: Split by punctuation to send to TTS
                    if token in [".", "!", "?", "\n"]:
                        # Send this sentence to TTS task
                        audio_bytes = await generate_tts(current_sentence)
                        if audio_bytes:
                            # Send Audio Binary
                            await websocket.send_bytes(audio_bytes)
                        current_sentence = "" # Reset buffer

                # Final flush if any text remains
                if current_sentence.strip():
                    audio_bytes = await generate_tts(current_sentence)
                    if audio_bytes:
                        await websocket.send_bytes(audio_bytes)

                # Signal end of turn
                await websocket.send_json({"type": "generation_end"})

    except WebSocketDisconnect:
        logger.info(f"WS Disconnected: {session_id}")
    except Exception as e:
        logger.error(f"WS Critical Error: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass