import logging
import httpx
import json
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator

# Local Imports
from config import settings
from memory import memory_engine
from schemas import ChatRequest

# Configure Logger
logger = logging.getLogger("Cortex_Chat_Router")

router = APIRouter()

async def stream_generator(url: str, payload: dict) -> AsyncGenerator[bytes, None]:
    """
    Proxies the streaming response from the downstream LLM Service to the client.
    Handles connection timeouts and stream iteration.
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            async with client.stream("POST", url, json=payload) as response:
                # Check for non-200 status codes immediately
                if response.status_code != 200:
                    error_msg = f"LLM Service returned status: {response.status_code}"
                    logger.error(error_msg)
                    yield json.dumps({"error": error_msg}).encode("utf-8")
                    return

                # Stream the content chunk by chunk
                async for chunk in response.aiter_bytes():
                    yield chunk
                    
        except httpx.ConnectError:
            logger.error(f"Failed to connect to LLM Service at {url}")
            yield json.dumps({"error": "LLM Service Unreachable"}).encode("utf-8")
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield json.dumps({"error": "Internal Stream Error"}).encode("utf-8")

@router.post("/api/chat")
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks):
    """
    Central Orchestration Endpoint for Chat.
    
    Workflow:
    1. Retrieve relevant context from Semantic Memory (RAG).
    2. Construct the system prompt based on Persona and Context.
    3. Delegate the inference task to the LLM Service (via Streaming).
    4. Asynchronously save the user's input to memory.
    """
    logger.info(f"📨 Incoming Chat Request | Session: {request.session_id} | Persona: {request.persona_id}")

    try:
        # --- 1. Memory Retrieval (RAG) ---
        context_str = ""
        if request.enable_memory:
            # Fetch top 3 relevant memories
            memories = memory_engine.search_memory(request.message, limit=3)
            if memories:
                context_str = "\n".join([f"- {m}" for m in memories])
                logger.info(f"📚 RAG: Injected {len(memories)} memory fragments.")

        # --- 2. Prompt Construction ---
        # Base prompt could be fetched from a database in the future.
        base_system_prompt = (
            f"You are {request.persona_id.capitalize()}, an advanced AI assistant. "
            "Use the provided context to answer accurately."
        )

        final_system_prompt = base_system_prompt
        if context_str:
            final_system_prompt += f"\n\n### RELEVANT MEMORY CONTEXT:\n{context_str}"

        # --- 3. Construct Payload for LLM Service ---
        llm_payload = {
            "message": request.message,
            "conversation_id": request.session_id,
            "persona_system_prompt": final_system_prompt,
            "stream": True
        }

        # --- 4. Background Task: Save User Input to Memory ---
        # We use BackgroundTasks to avoid blocking the response stream.
        if request.enable_memory:
            background_tasks.add_task(
                memory_engine.add_memory, 
                request.message, 
                {"role": "user", "session_id": request.session_id}
            )

        # --- 5. Proxy Stream to Client ---
        target_url = f"{settings.LLM_SERVICE_URL}/chat"
        return StreamingResponse(
            stream_generator(target_url, llm_payload),
            media_type="text/event-stream"
        )

    except Exception as e:
        logger.error(f"Critical Orchestration Error: {e}")
        raise HTTPException(status_code=500, detail="Orchestration Layer Failed")