import logging
import asyncio
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

# Internal Configuration & Clients
from config import settings
from services_client import service_client
from memory import memory_engine

# --- ROUTER IMPORTS ---
# We integrate the modular routers here.
# Note: Ensure 'backend/cortex/routers/chat.py' exists and dependencies are met.
from routers import chat, personas, system

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("Cortex_Core")

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME, 
    version=settings.VERSION,
    description="Neural Orchestrator (Cortex) - Manages LLM, Memory, and System State."
)

# CORS Configuration
# Allowed origins should be restricted in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REGISTER ROUTERS ---
# This activates the advanced endpoints defined in the 'routers' folder.
# e.g., /api/chat, /api/memory, /api/architect
app.include_router(chat.router)
# app.include_router(personas.router) # Uncomment when personas router is fully ready
# app.include_router(system.router)   # Uncomment when system router is fully ready

# --- STARTUP & SHUTDOWN EVENTS ---

@app.on_event("startup")
async def startup_event():
    """
    Executes system warm-up tasks on startup.
    """
    logger.info("🔥 Cortex Online. Initiating Warm-up Sequence...")
    asyncio.create_task(warmup_llm())

async def warmup_llm():
    """
    Sends a dummy request to LLM Service to load models into GPU memory.
    """
    try:
        await asyncio.sleep(5)  # Allow other services to stabilize
        # Check if LLM Service URL is configured
        if not settings.LLM_SERVICE_URL:
            logger.warning("⚠️ LLM_SERVICE_URL is not set. Skipping warm-up.")
            return

        async with httpx.AsyncClient(timeout=10.0) as client:
            # We assume the LLM service has a standard /chat or health endpoint
            await client.post(f"{settings.LLM_SERVICE_URL}/chat", json={
                "message": "ping", 
                "conversation_id": "warmup", 
                "stream": False
            })
        logger.info("✅ LLM Warm-up Signal Sent.")
    except Exception as e:
        logger.warning(f"⚠️ LLM Warm-up signal failed (Non-critical): {e}")

# --- CORE ENDPOINTS ---

@app.get("/health")
def health_check():
    """
    Service health check endpoint.
    """
    return {"status": "active", "role": "orchestrator", "version": settings.VERSION}

@app.post("/interact")
async def interact_legacy_proxy(request: Request):
    """
    Legacy endpoint to support existing Frontend calls to '/cortex/interact'.
    
    IMPORTANT: The Frontend currently uses 'CortexService.sendMessageBlocking' 
    which points here. In the future, we should migrate the Frontend to use 
    the advanced '/api/chat' endpoint provided by 'routers.chat'.
    
    For now, this maintains backward compatibility by proxying to the LLM service directly
    or using a simple logic.
    """
    try:
        body = await request.json()
        query = body.get("query") or body.get("message")
        session_id = body.get("session_id", "default")
        
        logger.info(f"🧠 Processing Legacy Interaction: {query} (Session: {session_id})")

        # Basic LLM Payload Construction
        llm_payload = {
            "message": query,
            "conversation_id": session_id,
            "stream": True
        }

        # Retrieve Context (Simple RAG) - Optional
        # if body.get("enable_memory", True):
        #    memories = memory_engine.search_memory(query, limit=2)
        #    if memories:
        #        context = "\n".join(memories)
        #        llm_payload["system_prompt"] = f"Context:\n{context}"

        # Proxy stream from LLM Service
        target_url = f"{settings.LLM_SERVICE_URL}/chat"
        return StreamingResponse(
            proxy_stream_generator(target_url, llm_payload),
            media_type="text/event-stream"
        )
        
    except Exception as e:
        logger.error(f"Interaction Error: {e}")
        return JSONResponse(
            status_code=500, 
            content={"error": str(e), "detail": "Orchestration failed."}
        )

async def proxy_stream_generator(url: str, payload: dict):
    """
    Helper function to proxy Server-Sent Events (SSE) from the LLM Service.
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            async with client.stream("POST", url, json=payload) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk
        except Exception as e:
            yield f"Error calling LLM Service: {str(e)}".encode()