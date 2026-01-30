import httpx
import logging
from config import settings

logger = logging.getLogger("Service_Client")

class ServiceClient:
    """
    A wrapper to handle HTTP communication with internal microservices.
    Includes timeout handling and error logging.
    """
    
    @staticmethod
    async def chat_with_llm(message: str, session_id: str, context: str = ""):
        """
        Sends a prompt to the LLM Service, injecting retrieved memory context.
        """
        # Construct System Prompt with Context (RAG)
        system_prompt = "You are a helpful AI assistant."
        if context:
            system_prompt += f"\nRelevant Memory Context:\n{context}"
        
        payload = {
            "message": message,
            "conversation_id": session_id,
            "persona_system_prompt": system_prompt,
            "stream": True # We want streaming response
        }
        
        # We return the request object/url for the frontend to connect via SSE,
        # OR we proxy the stream. For Cortex as Orchestrator, proxying is safer but more complex.
        # For this design, let's proxy the request generator.
        return payload

    @staticmethod
    async def get_market_data(symbol: str):
        """Calls Finance Service."""
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(f"{settings.FINANCE_SERVICE_URL}/market/price/{symbol}")
                resp.raise_for_status()
                return resp.json()
            except Exception as e:
                logger.error(f"Finance Service Error: {e}")
                return None

# Singleton
service_client = ServiceClient()