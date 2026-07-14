from typing import Dict

def calculate_combined_ats_score(
    semantic_score: float,       # 0.0 to 100.0 (Transformer similarity)
    tfidf_score: float,          # 0.0 to 100.0 (TF-IDF cosine similarity)
    skill_coverage_score: float, # 0.0 to 100.0 (Extracted required skills rate)
    formatting_score: float,     # 0.0 to 100.0 (Layout compliance score)
    experience_score: float,     # 0.0 to 100.0 (Experience section compliance check)
    weights: Dict[str, float] = None
) -> float:
    """
    Combines the distinct evaluations into a final rounded ATS compatibility score
    using customizable weights.
    """
    if weights is None:
        weights = {
            "semantic": 0.30,
            "keyword": 0.20,
            "skill_coverage": 0.30,
            "formatting": 0.10,
            "experience": 0.10
        }
        
    # Ensure weights sum to 1.0
    total_weight = sum(weights.values())
    if abs(total_weight - 1.0) > 0.01 and total_weight > 0.0:
        weights = {k: v / total_weight for k, v in weights.items()}
        
    ats_score = (
        (semantic_score * weights.get("semantic", 0.30)) +
        (tfidf_score * weights.get("keyword", 0.20)) +
        (skill_coverage_score * weights.get("skill_coverage", 0.30)) +
        (formatting_score * weights.get("formatting", 0.10)) +
        (experience_score * weights.get("experience", 0.10))
    )
    
    return float(round(ats_score, 1))
