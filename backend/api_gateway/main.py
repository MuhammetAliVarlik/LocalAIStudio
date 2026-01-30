from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Response, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
from config import settings

app = FastAPI(title=settings.PROJECT_NAME)

# --- CORS MIDDLEWARE ---
# Frontend (localhost:3000) ile konuşabilmesi için şart
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Prod'da ["http://localhost:3000"] yapılmalı
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- HTTP CLIENT ---
# Tek bir client oluşturup reuse etmek performans için önemlidir
http_client = httpx.AsyncClient()

@app.on_event("shutdown")
async def shutdown_event():
    await http_client.aclose()

# --- HELPER: GENERIC PROXY ---
async def forward_request(method: str, url: str, headers: dict = None, json=None, data=None, files=None):
    """
    Generic async proxy function with error handling.
    """
    try:
        # Header temizliği: Host header'ı genelde sorun çıkarır, onu forwarding'den çıkaralım
        if headers:
            headers = {k: v for k, v in headers.items() if k.lower() != 'host' and k.lower() != 'content-length'}

        response = await http_client.request(
            method, 
            url, 
            headers=headers,
            json=json, 
            data=data, 
            files=files, 
            timeout=60.0 # LLM cevapları uzun sürebilir
        )
        return response
    except httpx.RequestError as exc:
        print(f"Connection Error to {url}: {exc}")
        raise HTTPException(status_code=503, detail=f"Service Unavailable: {url}")

# =================================================================
# 🔐 AUTH SERVICE ROUTES
# =================================================================

@app.post("/api/register")
async def register(request: Request):
    # JSON verisini alıp Auth servisine iletiyoruz
    body = await request.json()
    resp = await forward_request("POST", f"{settings.AUTH_SERVICE_URL}/register", json=body)
    return JSONResponse(resp.json(), status_code=resp.status_code)

@app.post("/api/token")
async def login(request: Request):
    # Login, JSON değil Form-Data kullanır (OAuth2 standardı)
    form_data = await request.form()
    
    # Query Parametrelerini (remember_me) koru
    params = request.query_params
    query_str = f"?{params}" if params else ""
    
    resp = await forward_request(
        "POST", 
        f"{settings.AUTH_SERVICE_URL}/token{query_str}", 
        data=form_data
    )
    return JSONResponse(resp.json(), status_code=resp.status_code)

@app.post("/api/reset-password")
async def reset_password(request: Request):
    body = await request.json()
    resp = await forward_request("POST", f"{settings.AUTH_SERVICE_URL}/reset-password", json=body)
    return JSONResponse(resp.json(), status_code=resp.status_code)

@app.get("/api/users/me")
async def get_current_user(request: Request):
    # Token'ı (Authorization Header) Auth servisine iletmek zorundayız
    resp = await forward_request(
        "GET", 
        f"{settings.AUTH_SERVICE_URL}/users/me", 
        headers=dict(request.headers)
    )
    return JSONResponse(resp.json(), status_code=resp.status_code)

# =================================================================
# 🧠 LLM SERVICE ROUTES
# =================================================================

@app.post("/api/chat")
async def chat(request: Request):
    body = await request.json()
    
    # Streaming isteği mi?
    is_stream = body.get("stream", False)

    if is_stream:
        # Streaming Proxy: Gelen veriyi paket paket Frontend'e aktar
        async def stream_generator():
            async with http_client.stream("POST", f"{settings.LLM_SERVICE_URL}/chat", json=body) as resp:
                async for chunk in resp.aiter_bytes():
                    yield chunk

        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    else:
        # Normal Proxy
        resp = await forward_request("POST", f"{settings.LLM_SERVICE_URL}/chat", json=body)
        return JSONResponse(resp.json(), status_code=resp.status_code)

# =================================================================
# 🗣️ TTS SERVICE ROUTES (Text-to-Speech)
# =================================================================

@app.post("/api/tts")
async def tts(request: Request):
    body = await request.json()
    
    # TTS binary (ses dosyası) döner. Bunu JSON yapmamalıyız.
    resp = await forward_request("POST", f"{settings.TTS_SERVICE_URL}/generate", json=body)
    
    if resp.status_code != 200:
        return JSONResponse(resp.json(), status_code=resp.status_code)
        
    return Response(content=resp.content, media_type="audio/wav")

# =================================================================
# 👂 STT SERVICE ROUTES (Speech-to-Text)
# =================================================================

@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # Dosyayı RAM'e oku
    file_content = await file.read()
    
    # httpx formatına hazırla
    files = {
        'file': (file.filename, file_content, file.content_type)
    }
    
    resp = await forward_request("POST", f"{settings.STT_SERVICE_URL}/transcribe", files=files)
    return JSONResponse(resp.json(), status_code=resp.status_code)

# =================================================================
# 🎭 MOCK PERSONAS (Optional Helper)
# =================================================================
@app.get("/api/personas")
def get_personas():
    # Şimdilik Gateway'de sabit tutuyoruz, ileride Auth veritabanına taşınabilir
    return [
        {
            "id": "nova", 
            "name": "Nova", 
            "system_prompt": "You are Nova, a highly intelligent and efficient AI assistant focused on productivity and clear explanations.", 
            "color": "#22d3ee", 
            "voice": "af_sarah"
        },
        {
            "id": "sage", 
            "name": "Sage", 
            "system_prompt": "You are Sage, a wise and philosophical AI guide. You prefer deep, thoughtful answers.", 
            "color": "#10b981", 
            "voice": "am_adam"
        },
        {
            "id": "architect", 
            "name": "Architect", 
            "system_prompt": "You are The Architect. You are an expert software engineer and system designer. You speak in technical, precise terms.", 
            "color": "#f472b6", 
            "voice": "am_michael"
        }
    ]

# =================================================================
# 💸 FINANCE SERVICE ROUTES
# =================================================================
@app.get("/api/market/summary")
async def market_summary(request: Request):
    resp = await forward_request("GET", f"{settings.FINANCE_SERVICE_URL}/market/summary")
    return JSONResponse(resp.json(), status_code=resp.status_code)

@app.get("/api/market/history/{symbol}")
async def market_history(symbol: str, request: Request):
    resp = await forward_request("GET", f"{settings.FINANCE_SERVICE_URL}/market/history/{symbol}")
    return JSONResponse(resp.json(), status_code=resp.status_code)

# =================================================================
# 🌍 INFO SERVICE ROUTES
# =================================================================
@app.get("/api/weather")
async def weather(request: Request):
    params = request.query_params
    resp = await forward_request("GET", f"{settings.INFO_SERVICE_URL}/weather?{params}")
    return JSONResponse(resp.json(), status_code=resp.status_code)

@app.get("/api/news")
async def news(request: Request):
    params = request.query_params
    resp = await forward_request("GET", f"{settings.INFO_SERVICE_URL}/news?{params}")
    return JSONResponse(resp.json(), status_code=resp.status_code)

# =================================================================
# ⚡ AUTOMATION ROUTES
# =================================================================
@app.get("/api/tasks")
async def get_tasks(request: Request):
    resp = await forward_request("GET", f"{settings.AUTOMATION_SERVICE_URL}/tasks")
    return JSONResponse(resp.json(), status_code=resp.status_code)

@app.post("/api/tasks/{task_id}/toggle")
async def toggle_task(task_id: str, request: Request):
    resp = await forward_request("POST", f"{settings.AUTOMATION_SERVICE_URL}/tasks/{task_id}/toggle")
    return JSONResponse(resp.json(), status_code=resp.status_code)