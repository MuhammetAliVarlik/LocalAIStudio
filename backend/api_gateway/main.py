import httpx
import logging
from fastapi import FastAPI, Request, Depends, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from security import verify_token

# Configure Logging with standard format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("API_Gateway")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    openapi_url="/openapi.json"
)

# CORS Configuration
# Allows all origins for development. In production, restrict this to specific domains.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def forward_request(url: str, method: str, payload: dict = None, headers: dict = None, is_form_data: bool = False):
    """
    Generic proxy function to forward requests to downstream microservices.
    
    Args:
        url (str): The target service URL.
        method (str): HTTP method (GET, POST, etc.).
        payload (dict): The data to send (JSON body or Form data).
        headers (dict): HTTP headers to forward.
        is_form_data (bool): If True, sends payload as form-data (application/x-www-form-urlencoded).
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            req_args = {"headers": headers}
            
            if method == "GET":
                req_args["params"] = payload
            elif method in ["POST", "PUT", "PATCH"]:
                if is_form_data:
                    req_args["data"] = payload  # Send as form-data
                else:
                    req_args["json"] = payload  # Send as JSON

            # Perform the request
            if method == "GET":
                resp = await client.get(url, **req_args)
            elif method == "POST":
                resp = await client.post(url, **req_args)
            elif method == "PUT":
                resp = await client.put(url, **req_args)
            elif method == "DELETE":
                resp = await client.delete(url, **req_args)
            else:
                return JSONResponse({"error": "Method not allowed"}, status_code=405)
            
            # Forward the downstream status code and content
            return Response(
                content=resp.content,
                status_code=resp.status_code,
                media_type=resp.headers.get("content-type")
            )

        except httpx.ConnectError:
            logger.error(f"Connection failed to downstream service: {url}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE, 
                detail="Downstream service is currently unreachable."
            )
        except Exception as e:
            logger.error(f"Proxy internal error: {e}")
            raise