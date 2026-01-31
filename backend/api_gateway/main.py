import httpx
import logging
import asyncio
import websockets
import os
from fastapi import FastAPI, Request, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from config import settings

# Configure Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("API_Gateway")

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIG FALLBACKS ---
# Ensure we catch env vars even if config.py isn't updated immediately
STT_SERVICE_URL = os.getenv("STT_SERVICE_URL", "http://stt_service:8003")

# --- HTTP UTILS ---
async def forward_request(url: str, method: str, payload: dict = None, headers: dict = None):
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            req_args = {"headers": headers}
            if method == "GET":
                req_args["params"] = payload
            elif method in ["POST", "PUT", "PATCH", "DELETE"]:
                req_args["json"] = payload

            resp = await client.request(method, url, **req_args)
            return Response(content=resp.content, status_code=resp.status_code, media_type=resp.headers.get("content-type"))
        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="Service unavailable")
        except Exception as e:
            logger.error(f"Gateway Error: {e}")
            raise HTTPException(status_code=500, detail="Internal Gateway Error")

# --- WEBSOCKET PROXY UTILS ---
async def forward_ws(client_ws: WebSocket, target_url: str):
    """
    Establishes a WebSocket tunnel between the Client and the Target Service (Cortex).
    Manages bidirectional streaming of Text (JSON) and Binary (Audio).
    """
    async with websockets.connect(target_url) as server_ws:
        try:
            # Task 1: Client -> Server
            async def client_to_server():
                try:
                    while True:
                        message = await client_ws.receive()
                        if message["type"] == "websocket.receive":
                            if "text" in message:
                                await server_ws.send(message["text"])
                            elif "bytes" in message:
                                await server_ws.send(message["bytes"])
                except (WebSocketDisconnect, websockets.exceptions.ConnectionClosed):
                    pass # Normal closure

            # Task 2: Server -> Client
            async def server_to_client():
                try:
                    async for message in server_ws:
                        # Forward raw message (text or binary) directly
                        if isinstance(message, str):
                            await client_ws.send_text(message)
                        else:
                            await client_ws.send_bytes(message)
                except (WebSocketDisconnect, websockets.exceptions.ConnectionClosed):
                    pass # Normal closure

            # Run both tasks concurrently
            await asyncio.gather(client_to_server(), server_to_client())

        except Exception as e:
            logger.error(f"WS Tunnel Error: {e}")
            await client_ws.close(code=1011)

# --- ROUTES ---

@app.get("/health")
def health():
    return {"status": "active", "service": "gateway"}

# HTTP Routes (Auth, Info, etc.)
@app.api_route("/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def auth_proxy(path: str, request: Request):
    payload = await request.json() if request.method in ["POST", "PUT", "PATCH"] else request.query_params
    target_url = f"{settings.AUTH_SERVICE_URL}/{path}"
    return await forward_request(target_url, request.method, payload, dict(request.headers))

@app.api_route("/info/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def info_proxy(path: str, request: Request):
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            payload = await request.json()
        except:
            payload = {}
    else:
        payload = request.query_params
    target_url = f"{settings.INFO_SERVICE_URL}/{path}"
    return await forward_request(target_url, request.method, payload, dict(request.headers))

# --- FIX: ADD STT ROUTE ---
@app.api_route("/stt/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def stt_proxy(path: str, request: Request):
    """
    Forward requests to the STT Service.
    """
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            payload = await request.json()
        except:
            payload = {}
    else:
        payload = request.query_params

    target_url = f"{STT_SERVICE_URL}/{path}"
    return await forward_request(target_url, request.method, payload, dict(request.headers))

# --- CORTEX ROUTES (HTTP & WS) ---

@app.websocket("/cortex/ws/chat/{session_id}")
async def cortex_ws_proxy(websocket: WebSocket, session_id: str, token: str = None, persona_id: str = "default"):
    """
    WebSocket Proxy Endpoint.
    Connects: Client <-> Gateway <-> Cortex Service
    """
    await websocket.accept()
    
    # Construct internal Cortex WS URL
    cortex_host = settings.CORTEX_URL.replace("http://", "ws://").replace("https://", "wss://")
    target_url = f"{cortex_host}/ws/chat/{session_id}?token={token}&persona_id={persona_id}"
    
    logger.info(f"Opening WS Tunnel: {target_url}")
    await forward_ws(websocket, target_url)

@app.api_route("/cortex/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def cortex_http_proxy(path: str, request: Request):
    # Fallback for HTTP requests to Cortex
    payload = await request.json() if request.method in ["POST", "PUT", "PATCH"] else request.query_params
    target_url = f"{settings.CORTEX_URL}/{path}"
    return await forward_request(target_url, request.method, payload, dict(request.headers))