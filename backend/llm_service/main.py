import json
import logging
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from chains import LLMChainFactory
from config import settings

# Configure Logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("LLM_Service")

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# --- Schemas ---
class ChatRequest(BaseModel):
    message: str
    conversation_id: str
    model: str = settings.DEFAULT_MODEL
    persona_system_prompt: str = "You are a helpful AI assistant."
    stream: bool = True

# --- Endpoints ---

@app.get("/health")
def health_check():
    """
    Health check endpoint to verify connectivity with Ollama.
    """
    return {"status": "active", "backend": "Ollama", "url": settings.OLLAMA_URL}

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    """
    Main Chat Endpoint handling both Streaming and Blocking requests.
    Recommended: Use streaming for better UX.
    """
    logger.info(f"📨 Chat Request: {req.conversation_id} | Model: {req.model}")
    
    try:
        # 1. Initialize the Chain with Redis History
        chain = LLMChainFactory.create_conversational_chain(
            model_name=req.model,
            system_prompt=req.persona_system_prompt
        )
        
        # 2. Handle Streaming Response (Server-Sent Events)
        if req.stream:
            return StreamingResponse(
                generate_stream(chain, req.message, req.conversation_id),
                media_type="text/event-stream"
            )
        
        # 3. Handle Blocking Response (Fallback)
        response = await chain.ainvoke(
            {"input": req.message},
            config={"configurable": {"session_id": req.conversation_id}}
        )
        return {"response": response, "session_id": req.conversation_id}

    except Exception as e:
        logger.error(f"❌ LLM Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_stream(chain, message: str, session_id: str):
    """
    Async Generator that yields tokens as they are produced by the LLM.
    Formats output as Server-Sent Events (SSE).
    """
    try:
        async for chunk in chain.astream(
            {"input": message},
            config={"configurable": {"session_id": session_id}}
        ):
            if chunk:
                # SSE format: data: <content>\n\n
                # We json dump to ensure special characters (newlines) are handled safely
                yield f"data: {json.dumps({'content': chunk})}\n\n"
        
        # Signal end of stream
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        logger.error(f"Stream Interrupted: {e}")
        error_msg = json.dumps({"error": str(e)})
        yield f"data: {error_msg}\n\n"