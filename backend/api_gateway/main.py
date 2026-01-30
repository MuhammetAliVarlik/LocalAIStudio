import httpx
import logging
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from security import verify_token

# Professional Logging Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("API_Gateway")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def forward_request(url: str, method: str, payload: dict = None, headers: dict = None):
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            if method == "GET":
                resp = await client.get(url, params=payload, headers=headers)
            elif method == "POST":
                resp = await client.post(url, json=payload, headers=headers)
            elif method == "PUT":
                resp = await client.put(url, json=payload, headers=headers)
            elif method == "DELETE":
                resp = await client.delete(url, headers=headers)
            else:
                return JSONResponse({"error": "Method not allowed"}, status_code=405)
            
            # Returns the downstream response status and body
            return JSONResponse(resp.json(), status_code=resp.status_code)
        except Exception as e:
            logger.error(f"Proxy Connectivity Error to {url}: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                detail="Downstream service is currently unreachable"
            )

# --- PUBLIC ROUTES (No Authentication Required) ---

@app.get("/health")
def health_check():
    return {"status": "active", "gateway": "running"}

@app.post("/auth/login")
async def login_proxy(request: Request):
    try:
        body = await request.json()
        target_url = f"{settings.AUTH_SERVICE_URL}/auth/login"
        return await forward_request(target_url, "POST", body)
    except Exception as e:
        logger.error(f"Login Proxy Exception: {e}")
        raise HTTPException(status_code=400, detail="Invalid login request payload")

@app.post("/auth/register")
async def register_proxy(request: Request):
    try:
        body = await request.json()
        target_url = f"{settings.AUTH_SERVICE_URL}/auth/register"
        return await forward_request(target_url, "POST", body)
    except Exception as e:
        logger.error(f"Registration Proxy Exception: {e}")
        raise HTTPException(status_code=400, detail="Invalid registration request payload")

# --- PROTECTED ROUTES (JWT Token Required) ---

@app.api_route("/cortex/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def cortex_proxy(path: str, request: Request, username: str = Depends(verify_token)):
    target_url = f"{settings.CORTEX_URL}/{path}"
    
    # Inject authenticated user identity for downstream service context
    headers = {"X-User-ID": username}
    
    try:
        # Detect streaming endpoints based on path naming conventions
        if any(keyword in path for keyword in ["chat", "interact", "stream"]):
            body = await request.json() if request.method == "POST" else None
            
            async def stream_generator():
                async with httpx.AsyncClient(timeout=60.0) as client:
                    async with client.stream(request.method, target_url, json=body, headers=headers) as resp:
                        async for chunk in resp.aiter_bytes():
                            yield chunk
            
            return StreamingResponse(stream_generator(), media_type="text/event-stream")
        
        # Default proxying for standard REST operations
        else:
            body = await request.json() if request.method in ["POST", "PUT"] else None
            params = dict(request.query_params) if request.method == "GET" else None
            return await forward_request(target_url, request.method, body or params, headers)

    except Exception as e:
        logger.error(f"Cortex Orchestrator Proxy Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, 
            detail="Cortex service returned an error or is unreachable"
        )
    
@app.api_route("/info/{path:path}", methods=["GET"])
async def info_proxy(path: str, request: Request):
    target_url = f"http://info_service:8007/{path}"
    return await forward_request(target_url, "GET", None, None)