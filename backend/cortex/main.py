import os
import json
import io
import subprocess
import soundfile as sf
import datetime
import glob

# --- FASTAPI & UTILS ---
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse, Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# --- LANGCHAIN ---
from langchain_ollama import ChatOllama
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.documents import Document

# --- KOKORO TTS ---
from kokoro_onnx import Kokoro

# --- CONFIGURATION ---
WORKSPACE_DIR = os.getenv("WORKSPACE_DIR", "/app/workspace")
MEMORY_DIR = os.path.join(WORKSPACE_DIR, "memory_db")
PERSONAS_DIR = os.path.join(WORKSPACE_DIR, "personas") 
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")
MODEL_NAME = "deepseek-coder" 

# --- INITIALIZATION SAFETY CHECKS ---
if not os.path.exists(WORKSPACE_DIR):
    os.makedirs(WORKSPACE_DIR)

if not os.path.exists(PERSONAS_DIR):
    os.makedirs(PERSONAS_DIR)

# Create Default Nova if no personas exist
if not glob.glob(os.path.join(PERSONAS_DIR, "*.json")):
    print("⚠️ No personas found. Creating default 'nova.json'...")
    default_nova = {
        "id": "nova",
        "name": "Nova",
        "color": "#22d3ee",
        "traits": {"empathy": 75, "logic": 80, "creativity": 60, "humor": 40},
        "system_prompt": "You are Nova, an advanced AI assistant.",
        "map_state": {"nodes": [], "edges": []}
    }
    with open(os.path.join(PERSONAS_DIR, "nova.json"), "w") as f:
        json.dump(default_nova, f, indent=2)

app = FastAPI(title="Neural OS Cortex (Stable)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- LAZY LOADERS ---
_kokoro_instance = None
_vector_store_instance = None
_llm_instance = None

def get_kokoro():
    global _kokoro_instance
    if _kokoro_instance: return _kokoro_instance
    try:
        print("🔊 Loading Kokoro...")
        _kokoro_instance = Kokoro("/app/models/kokoro-v0_19.onnx", "/app/models/voices.bin")
        return _kokoro_instance
    except Exception as e:
        print(f"❌ Kokoro Failed: {e}")
        return None

def get_langchain():
    global _vector_store_instance, _llm_instance
    if _vector_store_instance and _llm_instance: return _vector_store_instance, _llm_instance

    print("🧠 Loading LangChain...")
    try:
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        _vector_store_instance = Chroma(
            persist_directory=MEMORY_DIR,
            embedding_function=embeddings,
            collection_name="neural_os_memory"
        )
        _llm_instance = ChatOllama(base_url=OLLAMA_URL, model=MODEL_NAME, temperature=0.3)
        return _vector_store_instance, _llm_instance
    except Exception as e:
        print(f"❌ LangChain Failed: {e}")
        return None, None

# --- MODELS ---
class ChatRequest(BaseModel):
    message: str
    model: str = MODEL_NAME
    persona_id: str = "nova"

class TTSRequest(BaseModel):
    text: str
    voice: str = "af_sarah"

class ArchitectRequest(BaseModel):
    prompt: str
    model: str = MODEL_NAME

class MemoryUpdate(BaseModel):
    text: str = None
    label: str = None
    emotion: str = None
    isCore: bool = None

class MemoryCreate(BaseModel):
    text: str
    label: str
    emotion: str = "neutral"
    persona_id: str = "nova"

class PersonaConfig(BaseModel):
    id: str
    name: str
    color: str
    traits: dict
    system_prompt: str
    map_state: dict = {}

class FileModel(BaseModel):
    name: str
    content: str
    language: str = "text"

class TerminalRequest(BaseModel):
    command: str

# --- BACKGROUND TASK ---
def consolidate_memory(user_text: str, persona_id: str):
    vector_store, llm = get_langchain()
    if not vector_store or not llm: return

    # Simple prompt to avoid brace syntax errors
    prompt = ChatPromptTemplate.from_template(
        "Extract one key fact from: '{text}'. If none, output 'NO'."
    )
    chain = prompt | llm | StrOutputParser()

    try:
        fact = chain.invoke({"text": user_text}).strip()
        if fact and "NO" not in fact and len(fact) > 5:
            print(f"💾 Learning for [{persona_id}]: {fact}")
            vector_store.add_documents([Document(
                page_content=fact, 
                metadata={
                    "source": "chat", 
                    "persona_id": persona_id,
                    "timestamp": datetime.datetime.now().isoformat(),
                    "emotion": "neutral",
                    "label": "DeepSeek Observation"
                }
            )])
    except Exception as e:
        print(f"Memory Error: {e}")

# --- API ENDPOINTS ---

# 1. PERSONA MANAGEMENT
@app.get("/api/personas")
async def list_personas():
    """Reads all JSON files in the personas directory."""
    personas = []
    try:
        files = glob.glob(os.path.join(PERSONAS_DIR, "*.json"))
        for filepath in files:
            try:
                with open(filepath, "r") as f:
                    data = json.load(f)
                    if "id" in data: personas.append(data)
            except Exception as e:
                print(f"Skipping corrupt persona file {filepath}: {e}")
    except Exception as e:
        print(f"Error listing personas: {e}")
        return [] # Return empty list instead of crashing
    
    return personas

@app.get("/api/personas/{persona_id}")
async def get_persona(persona_id: str):
    # Sanitize ID to prevent path traversal
    safe_id = "".join([c for c in persona_id if c.isalnum() or c in ('-','_')]).lower()
    path = os.path.join(PERSONAS_DIR, f"{safe_id}.json")
    
    if os.path.exists(path):
        try:
            with open(path, "r") as f: return json.load(f)
        except:
            return Response(status_code=500, content="Corrupt Config")
    return Response(status_code=404, content="Not Found")

@app.post("/api/personas")
async def save_persona(config: PersonaConfig):
    safe_id = "".join([c for c in config.id if c.isalnum() or c in ('-','_')]).lower()
    path = os.path.join(PERSONAS_DIR, f"{safe_id}.json")
    with open(path, "w") as f:
        json.dump(config.dict(), f, indent=2)
    return {"status": "saved", "id": safe_id}

@app.delete("/api/personas/{persona_id}")
async def delete_persona(persona_id: str):
    if persona_id == "nova": return {"status": "protected"}
    safe_id = "".join([c for c in persona_id if c.isalnum() or c in ('-','_')]).lower()
    path = os.path.join(PERSONAS_DIR, f"{safe_id}.json")
    if os.path.exists(path): os.remove(path)
    return {"status": "deleted"}

# 2. MEMORY MANAGEMENT
@app.get("/api/memory")
async def get_memories(persona_id: str = "nova"):
    vector_store, _ = get_langchain()
    if not vector_store: return []
    try:
        # ChromaDB .get() allows filtering metadata
        data = vector_store.get(where={"persona_id": persona_id})
    except:
        return []

    formatted = []
    if data and data['ids']:
        for i, _id in enumerate(data['ids']):
            meta = data['metadatas'][i] if data['metadatas'] else {}
            formatted.append({
                "id": _id,
                "text": data['documents'][i],
                "label": meta.get("label", "Memory"),
                "emotion": meta.get("emotion", "neutral"),
                "timestamp": meta.get("timestamp", datetime.datetime.now().isoformat()),
                "isCore": meta.get("isCore", False)
            })
    return formatted

@app.post("/api/memory")
async def create_memory(mem: MemoryCreate):
    vector_store, _ = get_langchain()
    if not vector_store: return Response(status_code=500)
    new_id = f"mem_{datetime.datetime.now().timestamp()}"
    vector_store.add_documents([Document(
        page_content=mem.text,
        metadata={
            "persona_id": mem.persona_id,
            "source": "manual",
            "timestamp": datetime.datetime.now().isoformat(),
            "emotion": mem.emotion,
            "label": mem.label,
            "isCore": False
        }
    )], ids=[new_id])
    return {"status": "created", "id": new_id}

@app.patch("/api/memory/{memory_id}")
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

@app.delete("/api/memory/{memory_id}")
async def delete_memory(memory_id: str):
    vector_store, _ = get_langchain()
    vector_store.delete(ids=[memory_id])
    return {"status": "deleted"}

# 3. CHAT
@app.post("/api/chat")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    vector_store, llm = get_langchain()
    if not llm: return Response(content="System Offline", media_type="text/plain")
    
    background_tasks.add_task(consolidate_memory, request.message, request.persona_id)
    
    # Load Persona Config Safely
    safe_id = "".join([c for c in request.persona_id if c.isalnum() or c in ('-','_')]).lower()
    try:
        with open(os.path.join(PERSONAS_DIR, f"{safe_id}.json"), "r") as f:
            persona_config = json.load(f)
    except:
        persona_config = {"system_prompt": "You are AI.", "traits": {}}

    # Pre-render prompt variables to avoid LangChain confusion
    traits_str = json.dumps(persona_config.get('traits', {})).replace("{", "{{").replace("}", "}}")
    sys_prompt_safe = persona_config.get('system_prompt', '').replace("{", "{{").replace("}", "}}")
    
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

# --- TOOLS ---
@app.post("/api/architect")
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

@app.post("/api/tts")
async def text_to_speech(request: TTSRequest):
    engine = get_kokoro()
    if not engine: return Response(status_code=500)
    try:
        samples, sample_rate = engine.create(request.text, voice=request.voice, speed=1.0, lang="en-us")
        buffer = io.BytesIO()
        sf.write(buffer, samples, sample_rate, format='WAV')
        buffer.seek(0)
        return Response(content=buffer.read(), media_type="audio/wav")
    except Exception as e: return Response(status_code=500, content=str(e))

@app.get("/api/files")
async def list_files():
    if not os.path.exists(WORKSPACE_DIR): os.makedirs(WORKSPACE_DIR)
    return [{"id": f, "name": f, "language": "text", "isOpen": False} for f in os.listdir(WORKSPACE_DIR) if not f.startswith('.')]

@app.get("/api/files/{filename}")
async def read_file(filename: str):
    path = os.path.join(WORKSPACE_DIR, os.path.basename(filename))
    if os.path.exists(path):
        with open(path, "r") as f: return {"name": filename, "content": f.read()}
    return Response(status_code=404)

@app.post("/api/files")
async def save_file(file: FileModel):
    with open(os.path.join(WORKSPACE_DIR, os.path.basename(file.name)), "w") as f: f.write(file.content)
    return {"status": "success"}

CURRENT_DIR = WORKSPACE_DIR 
@app.post("/api/terminal")
async def run_terminal(request: TerminalRequest):
    global CURRENT_DIR
    cmd = request.command.strip()
    if cmd.startswith("cd "):
        target = cmd[3:].strip()
        path = os.path.normpath(os.path.join(CURRENT_DIR, target))
        if os.path.isdir(path): CURRENT_DIR = path; return {"output": f"📂 {CURRENT_DIR}"}
    try:
        res = subprocess.run(cmd, shell=True, cwd=CURRENT_DIR, capture_output=True, text=True, timeout=10)
        return {"output": (res.stdout + res.stderr) or "✅"}
    except Exception as e: return {"output": f"💥 {str(e)}"}