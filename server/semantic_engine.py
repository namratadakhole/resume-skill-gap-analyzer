import time
from datetime import datetime

class SemanticEngine:
    """
    Lightweight, high-performance semantic matching engine using Scikit-Learn TF-IDF vectorization.
    Replaces heavy PyTorch/HuggingFace SentenceTransformer model downloads to prevent memory limits and 15-minute container freezes on cloud hosts like Render.
    """
    @classmethod
    def get_model(cls):
        return None

    @classmethod
    def calculate_similarity(cls, text1: str, text2: str) -> float:
        """
        Calculates cosine similarity between resume text and job description using TF-IDF tokenization.
        Executes instantly (<0.02s) with minimal memory footprint.
        """
        if not text1 or not text2 or not text1.strip() or not text2.strip():
            return 0.0
            
        start_t = time.time()
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity
            from nlp import preprocess_text
            
            tokens1 = preprocess_text(text1)
            tokens2 = preprocess_text(text2)
            
            if not tokens1 or not tokens2:
                return 0.0
                
            str1 = " ".join(tokens1)
            str2 = " ".join(tokens2)
            
            vectorizer = TfidfVectorizer()
            tfidf = vectorizer.fit_transform([str1, str2])
            sim = float(cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0])
            sim = float(max(0.0, min(1.0, sim)))
            
            elapsed = time.time() - start_t
            print(f"[{datetime.now().isoformat()}] [SEMANTIC] Calculated fast TF-IDF semantic similarity ({sim:.4f}) in {elapsed:.3f}s")
            return sim
        except Exception as e:
            print(f"[{datetime.now().isoformat()}] [SEMANTIC ERROR] Fallback calculation failed: {str(e)}")
            return 0.5
