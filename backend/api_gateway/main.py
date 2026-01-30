import httpx
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from security import verify_token
import logging

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("API_Gateway")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# CORS Configuration (Frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In prod, specify frontend URL (e.g., http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Helper: Async Reverse Proxy ---
async def forward_request(url: str, method: str, payload: dict = None, headers: dict = None):
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            if method == "GET":
                resp = await client.get(url, params=payload, headers=headers)
            elif method == "POST":
                resp = await client.post(url, json=payload, headers=headers)
            else:
                return JSONResponse({"error": "Method not allowed"}, status_code=405)
            
            # Forward the status code and content
            return JSONResponse(resp.json(), status_code=resp.status_code)
        except Exception as e:
            logger.error(f"Proxy Error to {url}: {e}")
            raise HTTPException(status_code=503, detail="Service Unavailable")

# --- PUBLIC ROUTES (No Auth Required) ---

@app.get("/health")
def health_check():
    return {"status": "active", "gateway": "running"}

@app.post("/auth/login")
async def login_proxy(request: Request):
    """Proxy login requests directly to Auth Service."""
    try:
        body = await request.json()
        return await forward_request(
            f"{settings.AUTH_SERVICE_URL}/login", 
            "POST", 
            body
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid Request")

@app.post("/auth/register")
async def register_proxy(request: Request):
    """Proxy registration requests."""
    try:
        body = await request.json()
        return await forward_request(
            f"{settings.AUTH_SERVICE_URL}/users/", 
            "POST", 
            body
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid Request")

# --- PROTECTED ROUTES (Auth Required) ---

@app.api_route("/cortex/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def cortex_proxy(path: str, request: Request, username: str = Depends(verify_token)):
    """
    Intelligent Proxy to Cortex Orchestrator.
    Intercepts /cortex/* and forwards it to the Cortex Service.
    Supports Streaming (SSE) for chat responses.
    """
    target_url = f"{settings.CORTEX_URL}/{path}"
    
    # Extract headers (pass auth token if needed by downstream, though we verified it)
    # Usually we might inject a 'X-User-ID' header here for Cortex to know who is asking.
    headers = {"X-User-ID": username}
    
    try:
        # Handle Streaming Requests (Chat) specifically
        if "chat" in path or "interact" in path or "stream" in path:
            body = await request.json() if request.method == "POST" else None
            
            # Create a generator for streaming response
            async def stream_generator():
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream(request.method, target_url, json=body, headers=headers) as resp:
                        async for chunk in resp.aiter_bytes():
                            yield chunk
            
            return StreamingResponse(stream_generator(), media_type="text/event-stream")
        
        # Handle Standard Requests
        else:
            body = await request.json() if request.method in ["POST", "PUT"] else None
            params = dict(request.query_params) if request.method == "GET" else None
            
            return await forward_request(target_url, request.method, body or params, headers)

    except Exception as e:
        logger.error(f"Cortex Proxy Error: {e}")
        raise HTTPException(status_code=502, detail="Cortex Unreachable")
    
@app.api_route("/info/{path:path}", methods=["GET"])
async def info_proxy(path: str, request: Request):
    target_url = f"http://info_service:8007/{path}"
    return await forward_request(target_url, "GET", None, None)