import logging
import json
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from memory import memory_engine
from services_client import service_client # Servis istemcisini import etmeyi unutma
import asyncio
from config import settings

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Cortex_Core")

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

class InteractionRequest(BaseModel):
    query: str
    session_id: str
    enable_memory: bool = True

@app.get("/health")
def health_check():
    return {"status": "active", "module": "Cortex Orchestrator"}

@app.on_event("startup")
async def startup_event():
    """
    Warm-up sequence to preload LLM into VRAM.
    """
    logger.info("🔥 Initiating System Warm-up...")
    
    # Arka planda çalıştır ki API'nin açılmasını bloklamasın
    asyncio.create_task(warmup_llm())

async def warmup_llm():
    """
    Sends a dummy request to LLM Service to force-load the model via Ollama.
    """
    try:
        # Ollama'nın ayağa kalkması için biraz bekle
        await asyncio.sleep(5) 
        
        logger.info("🧠 Warming up LLM (Loading model into VRAM)...")
        # Basit, kısa bir prompt gönder
        payload = {
            "message": "hi",
            "conversation_id": "warmup",
            "stream": False
        }
        # Servis istemcisi üzerinden veya direkt request ile
        # Burada ServiceClient yapımıza uygun bir metod ekleyebiliriz 
        # veya basitçe requests/httpx kullanabiliriz.
        # Örnek olarak service_client.chat_with_llm'i simüle ediyoruz:
        
        async with httpx.AsyncClient(timeout=10.0) as client:
             await client.post(
                 f"{settings.LLM_SERVICE_URL}/chat", 
                 json=payload
             )
             
        logger.info("✅ LLM Warm-up Complete. System Ready.")
        
    except Exception as e:
        logger.warning(f"⚠️ LLM Warm-up failed (might be ready later): {e}")

@app.post("/interact")
async def interact(req: InteractionRequest):
    """
    Main Orchestration Endpoint.
    1. Retrieval: Searches Long-Term Memory (Qdrant).
    2. Augmentation: Adds context to LLM Prompt.
    3. Generation: Streams response from LLM Service.
    4. Memorization: Saves the user query to memory (Async/Background ideally).
    """
    logger.info(f"🧠 Processing Interaction: {req.query}")
    
    # 1. Retrieval (RAG)
    context_str = ""
    if req.enable_memory:
        relevant_memories = memory_engine.search_memory(req.query)
        context_str = "\n".join(relevant_memories)
    
    # 2. Prepare Payload for LLM
    llm_payload = {
        "message": req.query,
        "conversation_id": req.session_id,
        "persona_system_prompt": f"You are Cortex, an advanced AI OS. Use this memory context if relevant: {context_str}",
        "stream": True
    }
    
    # 3. Memorize the new input (Fire and Forget strategy for speed)
    # In a real async setup, use BackgroundTasks
    if req.enable_memory:
        memory_engine.add_memory(req.query, {"type": "user_input"})

    # 4. Proxy Stream from LLM Service
    # We establish a stream to LLM and pipe it back to the client
    return StreamingResponse(
        proxy_stream_generator(settings.LLM_SERVICE_URL + "/chat", llm_payload),
        media_type="text/event-stream"
    )

async def proxy_stream_generator(url: str, payload: dict):
    """
    Helper to proxy SSE (Server-Sent Events) from LLM Service to Client.
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", url, json=payload) as response:
            async for chunk in response.aiter_bytes():
                yield chunk

@app.post("/memory/add")
def manual_add_memory(text: str):
    """Endpoint to manually inject knowledge."""
    memory_engine.add_memory(text, {"source": "manual"})
    return {"status": "success", "message": "Memory added."}