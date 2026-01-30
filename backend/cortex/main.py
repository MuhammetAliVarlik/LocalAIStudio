import logging
import json
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from memory import memory_engine
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