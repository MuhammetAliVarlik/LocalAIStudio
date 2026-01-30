from langchain_ollama import ChatOllama
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from config import MEMORY_DIR, OLLAMA_URL, MODEL_NAME
import datetime
import json

_vector_store_instance = None
_llm_instance = None

def get_langchain():
    global _vector_store_instance, _llm_instance
    if _vector_store_instance and _llm_instance: return _vector_store_instance, _llm_instance

    print("🧠 Loading LangChain...")
    try:
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        _vector_store_instance = Chroma(
            persist_directory=MEMORY_DIR,
            embedding_function=embeddings,
            collection_name="neural_os_memory"
        )
        _llm_instance = ChatOllama(base_url=OLLAMA_URL, model=MODEL_NAME, temperature=0.3)
        return _vector_store_instance, _llm_instance
    except Exception as e:
        print(f"❌ LangChain Failed: {e}")
        return None, None

def consolidate_memory(user_text: str, raw_persona_id: str):
    vector_store, llm = get_langchain()
    if not vector_store or not llm: return

    persona_id = "".join([c for c in raw_persona_id if c.isalnum() or c in ('-','_')]).lower()

    prompt = ChatPromptTemplate.from_template(
        "Analyze this user message: '{text}'.\n"
        "Extract a core fact, preference, or a brief summary of what the user is doing.\n"
        "Return a JSON object with keys: 'fact', 'label', 'emotion'.\n"
        "Output ONLY valid JSON."
    )
    
    chain = prompt | llm | StrOutputParser()

    try:
        response = chain.invoke({"text": user_text}).strip()
        try:
            start_idx = response.find('{')
            end_idx = response.rfind('}')
            if start_idx != -1 and end_idx != -1:
                clean_json = response[start_idx:end_idx+1]
                data = json.loads(clean_json)
                fact = data.get("fact", "NO")
                label = data.get("label", "General Observation")
                emotion = data.get("emotion", "neutral")
            else:
                raise ValueError("No JSON")
        except:
            if len(user_text) > 5:
                fact = f"User said: {user_text[:100]}"
                label = "Chat Log"
                emotion = "neutral"
            else:
                fact = "NO"

        if fact and "NO" not in fact:
            print(f"💾 [MEMORY] Saving for [{persona_id}]: {fact}")
            vector_store.add_documents([Document(
                page_content=fact, 
                metadata={
                    "source": "chat", 
                    "persona_id": persona_id,
                    "timestamp": datetime.datetime.now().isoformat(),
                    "emotion": emotion,
                    "label": label,
                    "isCore": False
                }
            )])
    except Exception as e:
        print(f"❌ Memory Consolidation Error: {e}")