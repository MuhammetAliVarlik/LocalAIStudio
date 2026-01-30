from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_core.chat_history import BaseChatMessageHistory
from config import settings
import logging

# Configure logging
logger = logging.getLogger("LLM_Memory")

def get_message_history(session_id: str) -> BaseChatMessageHistory:
    """
    Retrieves the chat history for a specific session from Redis.
    
    Args:
        session_id (str): Unique identifier for the conversation session.
        
    Returns:
        BaseChatMessageHistory: A history object connected to Redis.
    """
    try:
        history = RedisChatMessageHistory(
            url=settings.REDIS_URL,
            session_id=session_id,
            ttl=3600  # Optional: Set Time-To-Live (e.g., 1 hour) to auto-clean old chats
        )
        return history
    except Exception as e:
        logger.error(f"❌ Failed to connect to Redis Memory: {e}")
        # Fallback logic could be implemented here (e.g., in-memory dict), 
        # but for prod-ready systems, we prefer to fail fast or handle explicitly.
        raise e