from fastapi import APIRouter, Response
import glob
import os
import json
from schemas import PersonaConfig
from config import settings

router = APIRouter()

@router.get("/api/personas")
async def list_personas():
    personas = []
    try:
        files = glob.glob(os.path.join(settings.PERSONAS_DIR, "*.json"))
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

@router.get("/api/personas/{persona_id}")
async def get_persona(persona_id: str):
    safe_id = "".join([c for c in persona_id if c.isalnum() or c in ('-','_')]).lower()
    path = os.path.join(PERSONAS_DIR, f"{safe_id}.json")
    if os.path.exists(path):
        try:
            with open(path, "r") as f: return json.load(f)
        except:
            return Response(status_code=500, content="Corrupt Config")
    return Response(status_code=404, content="Not Found")

@router.post("/api/personas")
async def save_persona(config: PersonaConfig):
    safe_id = "".join([c for c in config.id if c.isalnum() or c in ('-','_')]).lower()
    path = os.path.join(PERSONAS_DIR, f"{safe_id}.json")
    with open(path, "w") as f:
        json.dump(config.dict(), f, indent=2)
    return {"status": "saved", "id": safe_id}

@router.delete("/api/personas/{persona_id}")
async def delete_persona(persona_id: str):
    if persona_id == "nova": return {"status": "protected"}
    safe_id = "".join([c for c in persona_id if c.isalnum() or c in ('-','_')]).lower()
    path = os.path.join(PERSONAS_DIR, f"{safe_id}.json")
    if os.path.exists(path): os.remove(path)
    return {"status": "deleted"}