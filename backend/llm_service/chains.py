from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from config import settings
from memory import get_session_history

def get_llm(model_name: str = None):
    """Initializes the ChatOllama client."""
    return ChatOllama(
        base_url=settings.OLLAMA_BASE_URL,
        model=model_name or settings.DEFAULT_MODEL,
        temperature=settings.TEMPERATURE,
        # Streaming desteklemesi için
        streaming=True
    )

def create_conversation_chain(llm, system_prompt: str):
    """Creates a conversational chain with history support."""
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "{system_prompt}"),
        MessagesPlaceholder(variable_name="history"), # Önceki mesajlar buraya gelir
        ("human", "{input}"),
    ])

    chain = prompt | llm

    # Wrap chain with message history capability
    return RunnableWithMessageHistory(
        chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="history",
    )