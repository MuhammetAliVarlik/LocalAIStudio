import logging
from typing import List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.http import models
from fastembed import TextEmbedding
from config import settings

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("Cortex_Memory")

class SemanticMemory:
    """
    Manages Long-Term Memory using Vector Embeddings.
    Uses Qdrant for storage and FastEmbed for generating embeddings locally.
    """
    
    def __init__(self):
        # Initialize Qdrant Client
        self.client = QdrantClient(url=settings.QDRANT_URL)
        
        # Initialize Embedding Model (Lazy Loading handled by library usually, but we init here)
        logger.info(f"🧠 Loading Embedding Model: {settings.EMBEDDING_MODEL}")
        self.embedding_model = TextEmbedding(model_name=settings.EMBEDDING_MODEL)
        
        # Ensure Collection Exists
        self._initialize_collection()

    def _initialize_collection(self):
        """Creates the Qdrant collection if it doesn't exist."""
        try:
            collections = self.client.get_collections()
            exists = any(c.name == settings.COLLECTION_NAME for c in collections.collections)
            
            if not exists:
                logger.info(f"Creating memory collection: {settings.COLLECTION_NAME}")
                self.client.create_collection(
                    collection_name=settings.COLLECTION_NAME,
                    vectors_config=models.VectorParams(
                        size=384, # bge-small-en-v1.5 output dimension
                        distance=models.Distance.COSINE
                    )
                )
        except Exception as e:
            logger.error(f"Failed to initialize memory: {e}")

    def add_memory(self, text: str, metadata: Dict[str, Any] = None):
        """
        Embeds and stores a piece of text into vector memory.
        """
        try:
            # Generate Embedding (Returns generator, convert to list)
            embeddings = list(self.embedding_model.embed([text]))
            vector = embeddings[0]
            
            # Upsert to Qdrant
            import uuid
            point_id = str(uuid.uuid4())
            
            payload = {"content": text}
            if metadata:
                payload.update(metadata)
            
            self.client.upsert(
                collection_name=settings.COLLECTION_NAME,
                points=[
                    models.PointStruct(
                        id=point_id,
                        vector=vector,
                        payload=payload
                    )
                ]
            )
            logger.info(f"💾 Memory Stored: {text[:30]}...")
        except Exception as e:
            logger.error(f"Error adding memory: {e}")

    def search_memory(self, query: str, limit: int = 3) -> List[str]:
        """
        Semantically searches the memory for relevant context.
        """
        try:
            # Embed Query
            query_embedding = list(self.embedding_model.embed([query]))[0]
            
            # Search Qdrant
            results = self.client.search(
                collection_name=settings.COLLECTION_NAME,
                query_vector=query_embedding,
                limit=limit
            )
            
            # Extract content
            context = [hit.payload["content"] for hit in results if "content" in hit.payload]
            logger.info(f"🔍 Memory Retrieval: Found {len(context)} relevant items.")
            return context
            
        except Exception as e:
            logger.error(f"Error searching memory: {e}")
            return []

# Singleton Instance
memory_engine = SemanticMemory()