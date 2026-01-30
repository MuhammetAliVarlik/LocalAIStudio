import psutil
import shutil
from fastapi import FastAPI, HTTPException
from duckduckgo_search import DDGS
import requests

app = FastAPI(title="Neural Info Service")

# --- SYSTEM MONITORING ---

def get_gpu_stats():
    """
    Safely fetch NVIDIA GPU stats using pynvml.
    Returns (vram_percent, vram_used_gb, total_vram_gb).
    """
    try:
        import pynvml
        pynvml.nvmlInit()
        handle = pynvml.nvmlDeviceGetHandleByIndex(0) # Get 1st GPU
        mem_info = pynvml.nvmlDeviceGetMemoryInfo(handle)
        util = pynvml.nvmlDeviceGetUtilizationRates(handle)
        
        total_gb = mem_info.total / (1024**3)
        used_gb = mem_info.used / (1024**3)
        percent = (used_gb / total_gb) * 100
        
        return round(percent), round(used_gb, 1), round(total_gb, 1)
    except:
        # No GPU or pynvml not installed
        return 0, 0, 0

@app.get("/system/stats")
def get_system_stats():
    """
    Returns real-time server metrics (CPU, RAM, GPU, Disk).
    """
    # CPU
    cpu_percent = psutil.cpu_percent(interval=None)
    cpu_threads = psutil.cpu_count(logical=True)
    
    # RAM
    ram = psutil.virtual_memory()
    ram_percent = ram.percent
    ram_used_gb = round(ram.used / (1024**3), 1)
    
    # GPU
    gpu_percent, gpu_used, gpu_total = get_gpu_stats()
    
    return {
        "cpu": {
            "percent": cpu_percent,
            "threads": cpu_threads
        },
        "ram": {
            "percent": ram_percent,
            "used_gb": ram_used_gb,
            "total_gb": round(ram.total / (1024**3), 1)
        },
        "gpu": {
            "percent": gpu_percent,
            "used_gb": gpu_used,
            "total_gb": gpu_total
        },
        "status": "online"
    }

@app.get("/weather")
def get_weather(city: str = "Ankara"):
    """
    Fetches weather via wttr.in (No API Key needed, very lightweight).
    """
    try:
        # format=j1 returns JSON
        url = f"https://wttr.in/{city}?format=j1"
        resp = requests.get(url, timeout=5)
        data = resp.json()
        
        current = data['current_condition'][0]
        return {
            "city": city,
            "temp_C": current['temp_C'],
            "desc": current['weatherDesc'][0]['value'],
            "humidity": current['humidity'],
            "wind": current['windspeedKmph']
        }
    except Exception as e:
        # Fallback if wttr.in is down
        return {"error": "Weather service unavailable", "detail": str(e)}

@app.get("/news")
def get_news(query: str = "technology"):
    """
    Fetches news using DuckDuckGo (Privacy focused, no API key).
    """
    try:
        with DDGS() as ddgs:
            # Get top 5 news results
            results = list(ddgs.news(keywords=query, max_results=5))
            return {"news": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search")
def web_search(query: str):
    """
    General web search for RAG context.
    """
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(keywords=query, max_results=3))
            return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))