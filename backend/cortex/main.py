import json
import os
import glob
from database import engine, Base
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Modüller
from config import PERSONAS_DIR
from routers import auth, chat, personas, system, tts

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Neural OS Cortex (Refactored)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- INIT DEFAULT PERSONA ---
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

# --- REGISTER ROUTERS ---
app.include_router(auth.router, tags=["Authentication"])
app.include_router(chat.router, tags=["Chat & Memory"])
app.include_router(personas.router, tags=["Personas"])
app.include_router(system.router, tags=["System"])
app.include_router(tts.router, tags=["TTS"])

print("🚀 Neural Cortex is running in modular mode...")