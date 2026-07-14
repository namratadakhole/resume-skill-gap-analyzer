import threading
import numpy as np

class SemanticEngine:
    """
    Cached, thread-safe singleton wrapper around sentence-transformers to calculate
    semantic similarities using the all-MiniLM-L6-v2 model. Uses a reentrant lock
    to allow background thread pre-warming without concurrency collisions.
    Defers the heavy sentence-transformers import to avoid server startup delays.
    """
    _model = None
    _lock = threading.RLock()

    @classmethod
    def get_model(cls):
        with cls._lock:
            if cls._model is None:
                try:
                    # Defer heavy import inside lock to avoid startup blocking
                    print("Importing sentence_transformers in background thread...")
                    from sentence_transformers import SentenceTransformer
                    print("Loading all-MiniLM-L6-v2 model in background thread...")
                    cls._model = SentenceTransformer('all-MiniLM-L6-v2')
                except Exception as e:
                    print(f"Error loading SentenceTransformer: {str(e)}")
                    cls._model = None
        return cls._model

    @classmethod
    def calculate_similarity(cls, text1: str, text2: str) -> float:
        """
        Encodes both texts using all-MiniLM-L6-v2 and calculates the cosine similarity.
        """
        if not text1.strip() or not text2.strip():
            return 0.0
            
        model = cls.get_model()
        if model is None:
            print("Warning: SentenceTransformer model not loaded. Similarity defaults to 0.0")
            return 0.0
            
        try:
            # Generate embeddings
            embeddings = model.encode([text1, text2])
            
            # Compute cosine similarity using normalized dot product
            norm1 = np.linalg.norm(embeddings[0])
            norm2 = np.linalg.norm(embeddings[1])
            
            if norm1 == 0.0 or norm2 == 0.0:
                return 0.0
                
            emb1 = embeddings[0] / norm1
            emb2 = embeddings[1] / norm2
            
            similarity = np.dot(emb1, emb2)
            # Clip between 0 and 1
            return float(max(0.0, min(1.0, similarity)))
        except Exception as e:
            print(f"Error calculating semantic similarity: {str(e)}")
            return 0.0
