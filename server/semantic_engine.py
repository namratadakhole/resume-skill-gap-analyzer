import time
import threading
import traceback
from datetime import datetime
import numpy as np

class SemanticEngine:
    """
    Cached, thread-safe singleton wrapper around sentence-transformers to calculate
    semantic similarities using the all-MiniLM-L6-v2 model.
    Includes explicit timing logs, error handling, and TF-IDF fallback if deep learning model is unavailable.
    """
    _model = None
    _lock = threading.RLock()
    _failed_to_load = False

    @classmethod
    def get_model(cls):
        if cls._failed_to_load:
            return None
            
        with cls._lock:
            if cls._model is None and not cls._failed_to_load:
                try:
                    start_t = time.time()
                    print(f"[{datetime.now().isoformat()}] [SEMANTIC] Loading SentenceTransformer ('all-MiniLM-L6-v2')...")
                    from sentence_transformers import SentenceTransformer
                    cls._model = SentenceTransformer('all-MiniLM-L6-v2')
                    elapsed = time.time() - start_t
                    print(f"[{datetime.now().isoformat()}] [SEMANTIC] SentenceTransformer model loaded successfully in {elapsed:.3f}s")
                except Exception as e:
                    print(f"[{datetime.now().isoformat()}] [SEMANTIC WARNING] Failed to load SentenceTransformer: {str(e)}")
                    cls._failed_to_load = True
                    cls._model = None
        return cls._model

    @classmethod
    def calculate_similarity(cls, text1: str, text2: str) -> float:
        """
        Encodes both texts using all-MiniLM-L6-v2 and calculates cosine similarity.
        Falls back smoothly to lexical TF-IDF cosine similarity if model is not loaded.
        """
        if not text1.strip() or not text2.strip():
            return 0.0
            
        start_t = time.time()
        model = cls.get_model()
        
        if model is None:
            # Fallback to TF-IDF cosine similarity
            from nlp import calculate_cosine_similarity
            fallback_sim = calculate_cosine_similarity(text1, text2)
            print(f"[{datetime.now().isoformat()}] [SEMANTIC] Using TF-IDF fallback similarity: {fallback_sim:.4f}")
            return fallback_sim
            
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
            result = float(max(0.0, min(1.0, similarity)))
            elapsed = time.time() - start_t
            print(f"[{datetime.now().isoformat()}] [SEMANTIC] Calculated Transformer similarity ({result:.4f}) in {elapsed:.3f}s")
            return result
        except Exception as e:
            print(f"[{datetime.now().isoformat()}] [SEMANTIC ERROR] Error in calculate_similarity: {str(e)}")
            from nlp import calculate_cosine_similarity
            return calculate_cosine_similarity(text1, text2)
