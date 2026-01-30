from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory

# In-Memory Store (Production'da Redis olmalı)
store = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    """Returns chat history for a specific session ID."""
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

def clear_history(session_id: str):
    if session_id in store:
        del store[session_id]