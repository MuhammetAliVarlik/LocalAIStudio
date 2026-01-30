# backend/cortex/main.py
import logging
import asyncio
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

# Kendi modüllerimiz (Sadece gerekli olanlar)
from config import settings
from memory import memory_engine
from services_client import service_client

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Cortex_Core")

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# --- Schemas ---
class InteractionRequest(BaseModel):
    query: str
    session_id: str
    enable_memory: bool = True
    persona_id: Optional[str] = "nova" # Hangi persona ile konuşuluyor

# --- Startup Events ---
@app.on_event("startup")
async def startup_event():
    """Warm-up sequence."""
    logger.info("🔥 Cortex Online. Initiating Warm-up...")
    asyncio.create_task(warmup_llm())

async def warmup_llm():
    try:
        await asyncio.sleep(5)
        # LLM servisine boş istek atarak modeli yüklet
        async with httpx.AsyncClient(timeout=10.0) as client:
             await client.post(f"{settings.LLM_SERVICE_URL}/chat", json={
                 "message": "ping", "conversation_id": "warmup", "stream": False
             })
        logger.info("✅ LLM Warm-up Signal Sent.")
    except Exception:
        logger.warning("⚠️ LLM Warm-up signal failed (Non-critical).")

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {"status": "active", "role": "orchestrator"}

@app.get("/personas")
def get_personas():
    """
    Returns available AI personas. 
    In future, this can be fetched from a DB, for now static is fine.
    """
    return [
        {"id": "nova", "name": "Nova", "color": "#22d3ee", "voice": "af_sarah", "system_prompt": "You are Nova, a helpful AI assistant."},
        {"id": "jarvis", "name": "Jarvis", "color": "#f59e0b", "voice": "am_michael", "system_prompt": "You are Jarvis, a highly intelligent system architect."},
        {"id": "sage", "name": "Sage", "color": "#10b981", "voice": "af_bella", "system_prompt": "You are Sage, a calm and wise mentor."}
    ]

@app.post("/interact")
async def interact(req: InteractionRequest):
    """
    Main Orchestration Endpoint (RAG + LLM Stream).
    """
    logger.info(f"🧠 Processing: {req.query} (Session: {req.session_id})")
    
    # 1. Memory Retrieval (RAG)
    context_str = ""
    if req.enable_memory:
        # Bellekten en alakalı 3 bilgiyi getir
        memories = memory_engine.search_memory(req.query, limit=3)
        if memories:
            context_str = "\n".join(memories)
            logger.info(f"📚 Context Found: {len(memories)} items")

    # 2. System Prompt Construction
    # Persona seçimine göre prompt'u ayarla (Burayı geliştirebiliriz)
    base_prompt = "You are a helpful AI."
    if req.persona_id == "jarvis":
        base_prompt = "You are Jarvis. Be concise, technical and precise."
    
    final_system_prompt = f"{base_prompt}\nRelevant Context from Memory:\n{context_str}"

    # 3. LLM Payload
    llm_payload = {
        "message": req.query,
        "conversation_id": req.session_id,
        "persona_system_prompt": final_system_prompt,
        "stream": True
    }

    # 4. Save to Memory (Asynchronously - Fire & Forget)
    # Kullanıcının dediğini hafızaya at
    if req.enable_memory:
        # Not: Gerçek hayatta bunu Celery task'e atmak daha iyidir
        memory_engine.add_memory(req.query, {"role": "user", "session": req.session_id})

    # 5. Proxy Stream (LLM Servisinden gelen cevabı Frontend'e akıt)
    return StreamingResponse(
        proxy_stream_generator(settings.LLM_SERVICE_URL + "/chat", llm_payload),
        media_type="text/event-stream"
    )

async def proxy_stream_generator(url: str, payload: dict):
    """
    Proxies SSE stream from LLM Service.
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", url, json=payload) as response:
            async for chunk in response.aiter_bytes():
                yield chunk