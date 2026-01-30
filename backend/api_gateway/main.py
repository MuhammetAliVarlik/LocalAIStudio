import httpx
import logging
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("API_Gateway")

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# CORS (Frontend Access)
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
            req_args = {"headers": headers}
            if method == "GET":
                req_args["params"] = payload
            elif method in ["POST", "PUT", "PATCH", "DELETE"]:
                req_args["json"] = payload # Send JSON to backend services

            resp = await client.request(method, url, **req_args)
            return Response(content=resp.content, status_code=resp.status_code, media_type=resp.headers.get("content-type"))
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Service unavailable")
        except Exception as e:
            logger.error(f"Gateway Error: {e}")
            raise HTTPException(status_code=500, detail="Internal Gateway Error")

# --- ROUTING ---

@app.get("/health")
def health():
    return {"status": "active", "service": "gateway"}

# Auth Service Proxy (/auth/login -> auth_service/login)
@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def auth_proxy(path: str, request: Request):
    payload = await request.json() if request.method in ["POST", "PUT", "PATCH"] else request.query_params
    # Construct URL: http://auth_service:8002/login (prefix removed if path is 'login')
    # Note: Frontend sends /auth/login. 'path' variable becomes 'login'.
    target_url = f"{settings.AUTH_SERVICE_URL}/{path}"
    return await forward_request(target_url, request.method, payload, dict(request.headers))

# Cortex Service Proxy
@app.api_route("/cortex/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def cortex_proxy(path: str, request: Request):
    payload = await request.json() if request.method in ["POST", "PUT", "PATCH"] else request.query_params
    target_url = f"{settings.CORTEX_URL}/{path}"
    return await forward_request(target_url, request.method, payload, dict(request.headers))

# --- INFO SERVICE PROXY ---
# Frontend: /info/system/stats -> Gateway -> Info Service: /system/stats
@app.api_route("/info/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def info_proxy(path: str, request: Request):
    """
    Routes requests starting with /info/ to the Info Service.
    Target: http://info_service:8007/{path}
    """
    # Gelen isteğin payload'ını veya query parametrelerini al
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            payload = await request.json()
        except:
            payload = {}
    else:
        payload = request.query_params

    # Hedef URL'i oluştur
    target_url = f"{settings.INFO_SERVICE_URL}/{path}"
    
    # İsteği yönlendir
    return await forward_request(
        url=target_url,
        method=request.method,
        payload=payload,
        headers=dict(request.headers)
    )