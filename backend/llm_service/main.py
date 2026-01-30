from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from schemas import ChatRequest
from chains import get_llm, create_conversation_chain
from config import settings
import json
import asyncio

app = FastAPI(title="Neural LLM Service", version="1.0.0")

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    """
    Main Chat Endpoint with Streaming Support.
    """
    try:
        # 1. Initialize Model
        llm = get_llm(req.model)
        
        # 2. Setup Chain with Memory
        chain = create_conversation_chain(llm, req.persona_system_prompt)
        
        # 3. Handle Streaming Response
        if req.stream:
            return StreamingResponse(
                generate_stream(chain, req.message, req.conversation_id, req.persona_system_prompt),
                media_type="text/event-stream"
            )
        
        # 4. Handle Blocking Response (Non-streaming)
        response = await chain.ainvoke(
            {"input": req.message, "system_prompt": req.persona_system_prompt},
            config={"configurable": {"session_id": req.conversation_id}}
        )
        return {"response": response.content, "model_used": llm.model}

    except Exception as e:
        print(f"LLM Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_stream(chain, message, session_id, system_prompt):
    """Generator function for streaming tokens."""
    async for chunk in chain.astream(
        {"input": message, "system_prompt": system_prompt},
        config={"configurable": {"session_id": session_id}}
    ):
        # LangChain chunk.content token'ı verir
        if chunk.content:
            yield chunk.content