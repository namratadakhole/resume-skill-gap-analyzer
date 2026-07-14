import re
from typing import Dict, List, Set
from nlp import clean_text

# Synonym dictionary maps common variations/abbreviations to their canonical form.
# All keys must be lowercase.
SYNONYMS_DB = {
    # React
    "reactjs": ["react", "react.js", "reactjs"],
    "react.js": ["react", "react.js", "reactjs"],
    "react": ["react", "react.js", "reactjs"],
    # Node
    "node": ["node", "node.js", "nodejs"],
    "nodejs": ["node", "node.js", "nodejs"],
    "node.js": ["node", "node.js", "nodejs"],
    # Python
    "python": ["python", "python programming"],
    "python programming": ["python", "python programming"],
    # Machine Learning
    "ml": ["ml", "machine learning"],
    "machine learning": ["ml", "machine learning"],
    # NLP
    "nlp": ["nlp", "natural language processing"],
    "natural language processing": ["nlp", "natural language processing"],
    # AI
    "ai": ["ai", "artificial intelligence"],
    "artificial intelligence": ["ai", "artificial intelligence"],
    # Deep Learning
    "deep learning": ["deep learning", "neural networks", "neural network"],
    "neural networks": ["deep learning", "neural networks", "neural network"],
    "neural network": ["deep learning", "neural networks", "neural network"]
}

def get_synonyms_for_skill(skill: str) -> List[str]:
    """
    Returns a list of variations/synonyms for a given skill (including the skill itself).
    """
    skill_lower = skill.strip().lower()
    return SYNONYMS_DB.get(skill_lower, [skill])

def match_skill_term(text: str, term: str) -> bool:
    """
    Tests if a specific string term matches within the text, accounting for word boundaries
    designed to safely handle characters like C++, C#, .NET etc.
    """
    escaped_term = re.escape(term)
    # Custom word boundaries: not preceded or followed by alphanumeric chars
    pattern = r'(?<![a-zA-Z0-9])' + escaped_term + r'(?![a-zA-Z0-9])'
    return bool(re.search(pattern, text, re.IGNORECASE))

def extract_skills_with_synonyms(text: str, skills_db: Dict[str, List[str]]) -> Dict[str, List[str]]:
    """
    Extracts skills from text based on a skills database and synonym mappings.
    If a skill or any of its synonyms is found in the text, it counts as matched.
    """
    found_skills = {}
    cleaned_text = clean_text(text)
    
    for category, skills in skills_db.items():
        found_skills[category] = []
        for skill in skills:
            # Gather all synonym variations for this skill
            variations = get_synonyms_for_skill(skill)
            
            # Check if the skill or any synonym matches the text
            has_match = False
            for term in variations:
                if match_skill_term(cleaned_text, term):
                    has_match = True
                    break
                    
            if has_match:
                if skill not in found_skills[category]:
                    found_skills[category].append(skill)
                    
    return {cat: skills for cat, skills in found_skills.items() if skills}
