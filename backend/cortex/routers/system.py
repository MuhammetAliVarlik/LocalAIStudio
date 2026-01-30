from fastapi import APIRouter, WebSocket, Response
import psutil
import pynvml
import asyncio
import os
import subprocess
from schemas import FileModel, TerminalRequest
from config import WORKSPACE_DIR

router = APIRouter()

# --- HARDWARE CHECK ---
HAS_GPU = False
try:
    pynvml.nvmlInit()
    HAS_GPU = True
except:
    pass

@router.websocket("/api/stats")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            cpu_percent = psutil.cpu_percent(interval=None)
            
            mem = psutil.virtual_memory()
            ram_percent = mem.percent
            ram_used_gb = round(mem.used / (1024**3), 1)
            
            gpu_percent = 0
            gpu_mem_used = 0
            if HAS_GPU:
                try:
                    handle = pynvml.nvmlDeviceGetHandleByIndex(0)
                    util = pynvml.nvmlDeviceGetUtilizationRates(handle)
                    mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
                    gpu_percent = util.gpu
                    gpu_mem_used = round(mem_info.used / (1024**3), 1)
                except:
                    pass
            
            await websocket.send_json({
                "cpu": cpu_percent,
                "ram": ram_percent,
                "ram_val": f"{ram_used_gb}GB",
                "gpu": gpu_percent,
                "gpu_val": f"{gpu_mem_used}GB" if HAS_GPU else "N/A",
                "tps": 0
            })
            
            await asyncio.sleep(1)
            
    except Exception as e:
        print(f"Stats Socket Error: {e}")
    finally:
        try:
            await websocket.close()
        except:
            pass

@router.get("/api/files")
async def list_files():
    if not os.path.exists(WORKSPACE_DIR): os.makedirs(WORKSPACE_DIR)
    return [{"id": f, "name": f, "language": "text", "isOpen": False} for f in os.listdir(WORKSPACE_DIR) if not f.startswith('.')]

@router.get("/api/files/{filename}")
async def read_file(filename: str):
    path = os.path.join(WORKSPACE_DIR, os.path.basename(filename))
    if os.path.exists(path):
        with open(path, "r") as f: return {"name": filename, "content": f.read()}
    return Response(status_code=404)

@router.post("/api/files")
async def save_file(file: FileModel):
    with open(os.path.join(WORKSPACE_DIR, os.path.basename(file.name)), "w") as f: f.write(file.content)
    return {"status": "success"}

CURRENT_DIR = WORKSPACE_DIR 

@router.post("/api/terminal")
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