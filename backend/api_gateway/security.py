import httpx
from fastapi import HTTPException, Security, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings
import logging

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Gateway_Security")

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """
    Validates the JWT token by calling the Auth Service (Introspection) 
    OR by verifying the signature locally if we share the secret key.
    
    For Microservices, local verification (if secret is shared) is faster (no network hop).
    """
    token = credentials.credentials
    
    try:
        # Option 1: Fast Local Verification (Shared Secret)
        from jose import jwt, JWTError
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return username
        
        # Option 2: Remote Verification (Call Auth Service)
        # async with httpx.AsyncClient() as client:
        #     resp = await client.post(f"{settings.AUTH_SERVICE_URL}/verify", json={"token": token})
        #     if resp.status_code != 200:
        #          raise HTTPException(status_code=401, detail="Invalid token")
        #     return resp.json()
            
    except Exception as e:
        logger.warning(f"Authentication Failed: {str(e)}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")