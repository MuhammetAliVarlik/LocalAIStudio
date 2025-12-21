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
MODEL_NAME = "llama3.1" 

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
        "voice": "af_sarah",
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
    voice: str = "af_sarah"
    traits: dict
    system_prompt: str
    map_state: dict = {}

class BriefingRequest(BaseModel):
    persona_id: str

class FileModel(BaseModel):
    name: str
    content: str
    language: str = "text"

class TerminalRequest(BaseModel):
    command: str

# --- BACKGROUND TASK ---
def consolidate_memory(user_text: str, raw_persona_id: str):
    vector_store, llm = get_langchain()
    if not vector_store or not llm: return

    persona_id = "".join([c for c in raw_persona_id if c.isalnum() or c in ('-','_')]).lower()

    # Prompt requesting JSON
    prompt = ChatPromptTemplate.from_template(
        "Analyze this user message: '{text}'.\n"
        "If it contains a new fact about the user, project, or preferences, return a JSON object with keys: 'fact', 'label', 'emotion'.\n"
        "If NO new fact, return {{ \"fact\": \"NO\" }}.\n"
        "Output ONLY valid JSON."
    )
    
    chain = prompt | llm | StrOutputParser()

    try:
        response = chain.invoke({"text": user_text}).strip()
        
        # Robust Parsing: Find the first '{' and last '}' to handle chatty models
        try:
            start_idx = response.find('{')
            end_idx = response.rfind('}')
            if start_idx != -1 and end_idx != -1:
                clean_json = response[start_idx:end_idx+1]
                data = json.loads(clean_json)
                fact = data.get("fact", "NO")
                label = data.get("label", "General Observation")
                emotion = data.get("emotion", "neutral")
            else:
                raise ValueError("No JSON found")
        except:
            # Fallback: If JSON fails, check if the text itself looks like a fact
            if "NO" not in response and len(response) < 200:
                fact = response
                label = "Raw Observation"
                emotion = "neutral"
            else:
                fact = "NO"

        if fact and "NO" not in fact and len(fact) > 3:
            print(f"💾 [MEMORY] Saving for [{persona_id}]: {fact}")
            vector_store.add_documents([Document(
                page_content=fact, 
                metadata={
                    "source": "chat", 
                    "persona_id": persona_id,
                    "timestamp": datetime.datetime.now().isoformat(),
                    "emotion": emotion,
                    "label": label
                }
            )])
    except Exception as e:
        print(f"❌ Memory Consolidation Error: {e}")

# --- API ENDPOINTS ---

@app.get("/api/personas")
async def list_personas():
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
        return [] 
    return personas

@app.get("/api/personas/{persona_id}")
async def get_persona(persona_id: str):
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

@app.get("/api/memory")
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

@app.post("/api/memory")
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

@app.post("/api/briefing")
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

@app.post("/api/chat")
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
        sys_prompt += "\n\n### PRIME DIRECTIVES:\n" + "\n".join(map_directives)

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
        # Fixed: Fallback to af_sarah if empty string
        voice_to_use = request.voice if request.voice else "af_sarah"
        samples, sample_rate = engine.create(request.text, voice=voice_to_use, speed=1.0, lang="en-us")
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