from fastapi import APIRouter, BackgroundTasks, Response
from fastapi.responses import StreamingResponse
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.documents import Document
import os
import json
import datetime

from schemas import ChatRequest, MemoryCreate, MemoryUpdate, BriefingRequest, ArchitectRequest
from services.llm_engine import get_langchain, consolidate_memory
from config import PERSONAS_DIR

router = APIRouter()

@router.post("/api/chat")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    vector_store, llm = get_langchain()
    if not llm: return Response(content="System Offline", media_type="text/plain")
    
    background_tasks.add_task(consolidate_memory, request.message, request.persona_id)
    safe_id = "".join([c for c in request.persona_id if c.isalnum() or c in ('-','_')]).lower()
    
    try:
        with open(os.path.join(PERSONAS_DIR, f"{safe_id}.json"), "r") as f:
            persona_config = json.load(f)
    except:
        persona_config = {"system_prompt": "You are AI.", "traits": {}}

    traits_str = json.dumps(persona_config.get('traits', {})).replace("{", "{{").replace("}", "}}")
    sys_prompt = persona_config.get('system_prompt', '')

    map_directives = []
    if "map_state" in persona_config and "nodes" in persona_config["map_state"]:
        for node in persona_config["map_state"]["nodes"]:
            if node.get("type") == "directive":
                lbl = node.get("data", {}).get("label", "")
                if lbl: map_directives.append(f"- {lbl}")
    
    if map_directives:
        sys_prompt += "\n\n### PRIME DIRECTIVES (OVERRIDE):\n" + "\n".join(map_directives)

    sys_prompt_safe = sys_prompt.replace("{", "{{").replace("}", "}}")
    
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 2, "filter": {"persona_id": request.persona_id}}
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", f"IDENTITY: {sys_prompt_safe}\nSTATS: {traits_str}\n\nCONTEXT:\n{{context}}"),
        ("user", "{question}")
    ])
    
    chain = ({"context": retriever, "question": RunnablePassthrough()} | prompt | llm | StrOutputParser())

    async def generate():
        async for chunk in chain.astream(request.message): yield chunk
    return StreamingResponse(generate(), media_type="text/plain")

@router.get("/api/memory")
async def get_memories(persona_id: str = "nova", limit: int = 50):
    safe_id = "".join([c for c in persona_id if c.isalnum() or c in ('-','_')]).lower()
    vector_store, _ = get_langchain()
    if not vector_store: return []
    try:
        data = vector_store.get(where={"persona_id": safe_id}, limit=limit)
    except:
        return []
    formatted = []
    if data and data['ids']:
        count = len(data['ids'])
        for i in range(count):
            meta = data['metadatas'][i] if data['metadatas'] else {}
            formatted.append({
                "id": data['ids'][i],
                "text": data['documents'][i],
                "label": meta.get("label", "Memory"),
                "emotion": meta.get("emotion", "neutral"),
                "timestamp": meta.get("timestamp", datetime.datetime.now().isoformat()),
                "isCore": meta.get("isCore", False)
            })
    formatted.sort(key=lambda x: x['timestamp'])
    return formatted

@router.post("/api/memory")
async def create_memory(mem: MemoryCreate):
    vector_store, _ = get_langchain()
    if not vector_store: return Response(status_code=500)
    safe_id = "".join([c for c in mem.persona_id if c.isalnum() or c in ('-','_')]).lower()
    new_id = f"mem_{datetime.datetime.now().timestamp()}"
    vector_store.add_documents([Document(
        page_content=mem.text,
        metadata={
            "persona_id": safe_id,
            "source": "manual",
            "timestamp": datetime.datetime.now().isoformat(),
            "emotion": mem.emotion,
            "label": mem.label,
            "isCore": False
        }
    )], ids=[new_id])
    return {"status": "created", "id": new_id}

@router.patch("/api/memory/{memory_id}")
async def update_memory(memory_id: str, update: MemoryUpdate):
    vector_store, _ = get_langchain()
    collection = vector_store._collection
    existing = collection.get(ids=[memory_id])
    if not existing['ids']: return Response(status_code=404)
    current_meta = existing['metadatas'][0]
    if update.label: current_meta['label'] = update.label
    if update.emotion: current_meta['emotion'] = update.emotion
    if update.isCore is not None: current_meta['isCore'] = update.isCore
    collection.update(
        ids=[memory_id],
        documents=[update.text] if update.text else None,
        metadatas=[current_meta]
    )
    return {"status": "updated"}

@router.delete("/api/memory/{memory_id}")
async def delete_memory(memory_id: str):
    vector_store, _ = get_langchain()
    vector_store.delete(ids=[memory_id])
    return {"status": "deleted"}

@router.post("/api/briefing")
async def generate_briefing(request: BriefingRequest):
    vector_store, llm = get_langchain()
    if not llm: return Response(status_code=500, content="System Offline")
    safe_id = "".join([c for c in request.persona_id if c.isalnum() or c in ('-','_')]).lower()
    try:
        with open(os.path.join(PERSONAS_DIR, f"{safe_id}.json"), "r") as f:
            persona_config = json.load(f)
    except:
        persona_config = {"name": "Assistant", "system_prompt": "You are a helpful assistant."}
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 5, "filter": {"persona_id": safe_id}}
    )
    prompt = ChatPromptTemplate.from_template(
        "IDENTITY: {system_prompt}\nTASK: Generate a concise 'Morning Briefing'. "
        "Summarize recent context or wish them a productive day. Keep it under 3 sentences.\n"
        "CONTEXT:\n{context}\nBRIEFING:"
    )
    chain = ({"context": retriever, "system_prompt": lambda x: persona_config.get('system_prompt', 'System Ready')} | prompt | llm | StrOutputParser())
    try:
        briefing = chain.invoke("recent events")
        return {"briefing": briefing}
    except Exception as e:
        return {"briefing": f"Systems online. (Error: {str(e)})"}

@router.post("/api/architect")
async def architect_mode(request: ArchitectRequest):
    _, llm = get_langchain()
    if not llm: return Response(status_code=500)
    prompt = ChatPromptTemplate.from_template("Generate JS 3D code. Req: {input}. Vars: i, count, time. End with 'return {{ x, y, z, color }};'")
    chain = prompt | llm | StrOutputParser()
    try:
        raw = chain.invoke({"input": request.prompt})
        clean = raw.replace("```javascript", "").replace("```", "").strip()
        if "return" not in clean: clean = "return { x: 0, y: 0, z: 0, color: 'white' };"
        return {"code": clean}
    except Exception as e: return Response(status_code=500, content=str(e))