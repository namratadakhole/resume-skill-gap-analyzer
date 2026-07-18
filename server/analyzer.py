import json
import re
from typing import Dict, List, Set, Tuple, Any

from nlp import preprocess_text, clean_text
from semantic_engine import SemanticEngine
from skill_matcher import extract_skills_with_synonyms
from resume_parser import parse_resume_data
from ats_calculator import calculate_combined_ats_score

def load_skills_database(filepath: str) -> Dict[str, List[str]]:
    """
    Loads skills database from a JSON file.
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading skills database: {str(e)}")
        # Fallback minimal database
        return {
            "Programming Languages": ["python", "javascript", "typescript", "java", "c++", "c#", "go", "sql", "html", "css"],
            "Frameworks": ["react", "angular", "vue", "django", "flask", "fastapi", "spring boot", "express"],
            "Cloud & DevOps": ["aws", "azure", "docker", "kubernetes", "git", "ci/cd"],
            "Databases": ["postgresql", "mysql", "mongodb", "redis", "sqlite"],
            "Soft Skills": ["communication", "teamwork", "leadership", "problem solving"]
        }

def calculate_cosine_similarity(text1: str, text2: str) -> float:
    """
    TF-IDF Vectorization and Cosine Similarity calculation.
    Used as a secondary score for lexical keyword matching.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    
    tokens1 = preprocess_text(text1)
    tokens2 = preprocess_text(text2)
    
    if not tokens1 or not tokens2:
        return 0.0
        
    str1 = " ".join(tokens1)
    str2 = " ".join(tokens2)
    
    try:
        vectorizer = TfidfVectorizer()
        tfidf = vectorizer.fit_transform([str1, str2])
        sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
        return float(sim)
    except Exception as e:
        print(f"Error in TF-IDF cosine similarity: {str(e)}")
        return 0.0

def evaluate_formatting_heuristics(raw_text: str) -> Dict[str, Any]:
    """
    Evaluates basic formatting and structure rules for a resume.
    """
    score = 100
    checks = []
    
    # 1. Length check
    word_count = len(raw_text.split())
    if word_count < 100:
        score -= 20
        checks.append({"name": "Resume Length", "status": "Fail", "message": "Resume is too short. (Under 100 words)"})
    elif word_count > 1500:
        score -= 10
        checks.append({"name": "Resume Length", "status": "Warning", "message": "Resume is quite long. (Over 1500 words). Try to keep it concise."})
    else:
        checks.append({"name": "Resume Length", "status": "Pass", "message": f"Optimal length: {word_count} words."})
        
    # 2. Contact details check
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    phone_pattern = r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
    
    has_email = bool(re.search(email_pattern, raw_text))
    has_phone = bool(re.search(phone_pattern, raw_text))
    
    if not has_email:
        score -= 15
        checks.append({"name": "Email Contact", "status": "Fail", "message": "No email address detected."})
    else:
        checks.append({"name": "Email Contact", "status": "Pass", "message": "Email address detected."})
        
    if not has_phone:
        score -= 10
        checks.append({"name": "Phone Contact", "status": "Warning", "message": "No phone number detected."})
    else:
        checks.append({"name": "Phone Contact", "status": "Pass", "message": "Phone number detected."})
        
    # 3. Essential Sections check
    sections = {
        "education": [r'\beducation\b', r'\bacademic\b', r'\bdegree\b'],
        "experience": [r'\bexperience\b', r'\bhistory\b', r'\bemployment\b', r'\bwork\b', r'\bprofessional experience\b'],
        "skills": [r'\bskills\b', r'\btechnologies\b', r'\bcore competencies\b', r'\bexpertise\b'],
        "projects": [r'\bprojects\b', r'\bpublications\b', r'\bportfolio\b']
    }
    
    for sec_name, patterns in sections.items():
        found = False
        for pattern in patterns:
            if re.search(pattern, raw_text, re.IGNORECASE):
                found = True
                break
        if not found:
            score -= 10
            checks.append({"name": f"Section: {sec_name.capitalize()}", "status": "Warning", "message": f"Section '{sec_name.capitalize()}' not explicitly found. Consider adding this section header."})
        else:
            checks.append({"name": f"Section: {sec_name.capitalize()}", "status": "Pass", "message": f"Section header '{sec_name.capitalize()}' detected."})
            
    return {
        "score": max(0, score),
        "checks": checks
    }

def analyze_resume(resume_text: str, job_desc_text: str, skills_db: Dict[str, List[str]], weights: Dict[str, float] = None) -> Dict[str, Any]:
    """
    Performs comprehensive Transformer + TF-IDF semantic and keyword analysis.
    """
    from datetime import datetime
    import time
    start_time = time.time()
    print(f"[{datetime.now().isoformat()}] [ANALYZER STEP 1/7] Starting Semantic Cosine Similarity calculation...")
    
    # 1. Semantic Cosine Similarity (Sentence Transformer: all-MiniLM-L6-v2)
    semantic_similarity = SemanticEngine.calculate_similarity(resume_text, job_desc_text)
    semantic_score = round(semantic_similarity * 100, 1)
    print(f"[{datetime.now().isoformat()}] [ANALYZER STEP 2/7] Semantic score: {semantic_score}%. Starting Keyword TF-IDF Similarity...")
    
    # 2. Keyword Cosine Similarity (Lexical TF-IDF match)
    tfidf_similarity = calculate_cosine_similarity(resume_text, job_desc_text)
    keyword_score = round(tfidf_similarity * 100, 1)
    print(f"[{datetime.now().isoformat()}] [ANALYZER STEP 3/7] Keyword score: {keyword_score}%. Extracting skills...")
    
    # 3. Skills Coverage Extraction (Synonym mapping enabled)
    resume_skills = extract_skills_with_synonyms(resume_text, skills_db)
    job_skills = extract_skills_with_synonyms(job_desc_text, skills_db)
    
    resume_skills_set = {skill for cat_skills in resume_skills.values() for skill in cat_skills}
    job_skills_set = {skill for cat_skills in job_skills.values() for skill in cat_skills}
    
    matched_skills = resume_skills_set.intersection(job_skills_set)
    missing_skills = job_skills_set.difference(resume_skills_set)
    extra_skills = resume_skills_set.difference(job_skills_set)
    
    if job_skills_set:
        skill_coverage_score = round((len(matched_skills) / len(job_skills_set)) * 100, 1)
    else:
        skill_coverage_score = 100.0
        
    categorized_matched = {}
    categorized_missing = {}
    
    for category, skills in skills_db.items():
        cat_matched = [s for s in skills if s in matched_skills]
        cat_missing = [s for s in skills if s in missing_skills]
        if cat_matched:
            categorized_matched[category] = cat_matched
        if cat_missing:
            categorized_missing[category] = cat_missing
            
    print(f"[{datetime.now().isoformat()}] [ANALYZER STEP 4/7] Skill coverage: {skill_coverage_score}% (Matched: {len(matched_skills)}, Missing: {len(missing_skills)}). Evaluating formatting heuristics...")
    
    # 4. Layout Audits Formatting Score
    formatting_result = evaluate_formatting_heuristics(resume_text)
    formatting_score = formatting_result["score"]
    
    # 5. Experience Section Compliance Match
    has_exp_section = any(
        check["name"].lower() == "section: experience" and check["status"] == "Pass"
        for check in formatting_result["checks"]
    )
    experience_score = 100.0 if has_exp_section else 50.0
    print(f"[{datetime.now().isoformat()}] [ANALYZER STEP 5/7] Formatting: {formatting_score}%, Experience: {experience_score}%. Calculating combined ATS score...")
    
    # 6. Combined ATS compatibility calculation
    ats_score = calculate_combined_ats_score(
        semantic_score,
        keyword_score,
        skill_coverage_score,
        formatting_score,
        experience_score,
        weights
    )
    print(f"[{datetime.now().isoformat()}] [ANALYZER STEP 6/7] Combined ATS score: {ats_score}%. Extracting candidate profile metadata...")
    
    # 7. Candidate Profile Resume Intelligence Extraction
    parser_results = parse_resume_data(resume_text)
    
    # Tiers and summary mapping
    if ats_score >= 75:
        tier = "High Match"
        summary = "Excellent semantic fit. The candidate profile matches core technical skills and demonstrates layout compliance."
    elif ats_score >= 50:
        tier = "Medium Match"
        summary = "Moderate semantic match. Key skill gaps remain, but the overall structure holds significant alignment."
    else:
        tier = "Low Match"
        summary = "Weak alignment. The resume requires revisions to integrate missing keywords and re-align descriptions."
        
    top_keywords = list(matched_skills)[:10]
    
    print(f"[{datetime.now().isoformat()}] [ANALYZER STEP 7/7] Generating personalized recommendations...")
    # Generate recommendations
    recommendations = generate_personalized_recommendations(missing_skills, categorized_missing, ats_score)
    
    elapsed = time.time() - start_time
    print(f"[{datetime.now().isoformat()}] [ANALYZER COMPLETE] Resume analysis finished in {elapsed:.3f}s. ATS Score: {ats_score}%, Tier: {tier}")
    
    return {
        "ats_score": ats_score,
        "semantic_score": semantic_score,
        "keyword_score": keyword_score,
        "skills_match_score": skill_coverage_score,
        "formatting_score": formatting_score,
        "experience_score": experience_score,
        "tier": tier,
        "summary": summary,
        "skills": {
            "matched": list(matched_skills),
            "missing": list(missing_skills),
            "extra": list(extra_skills),
            "categorized_matched": categorized_matched,
            "categorized_missing": categorized_missing
        },
        "formatting_checks": formatting_result["checks"],
        "top_keywords": top_keywords,
        "recommendations": recommendations,
        "parser_results": parser_results
    }

def generate_personalized_recommendations(missing_skills: Set[str], categorized_missing: Dict[str, List[str]], ats_score: float) -> List[Dict[str, str]]:
    """
    Generates personalized recommendations, courses, or certifications based on missing skills.
    """
    recs = []
    
    # Standard recommendations map
    skill_learning_map = {
        # Cloud/Devops
        "aws": {"resource": "AWS Certified Cloud Practitioner or Solutions Architect Course", "type": "Certification"},
        "azure": {"resource": "Microsoft Azure Fundamentals (AZ-900) Certification", "type": "Certification"},
        "gcp": {"resource": "Google Associate Cloud Engineer training", "type": "Certification"},
        "docker": {"resource": "Docker Mastery course on Udemy or freeCodeCamp Docker tutorial", "type": "Online Course"},
        "kubernetes": {"resource": "Certified Kubernetes Administrator (CKA) or Kubernetes for Beginners", "type": "Certification"},
        "terraform": {"resource": "HashiCorp Certified: Terraform Associate prep", "type": "Certification"},
        "ci/cd": {"resource": "GitHub Actions or Jenkins CI/CD masterclass", "type": "Online Course"},
        # Languages
        "python": {"resource": "Python for Everybody (Coursera) or Real Python guides", "type": "Online Course"},
        "typescript": {"resource": "TypeScript Deep Dive guide or official handbook", "type": "Online Course"},
        "go": {"resource": "A Tour of Go or Go Programming Blueprints", "type": "Interactive Tutorial"},
        "rust": {"resource": "The Rust Programming Language Book", "type": "Online Course"},
        # Frontend
        "react": {"resource": "React - The Complete Guide (Udemy) or official React docs", "type": "Online Course"},
        "next.js": {"resource": "Next.js official dashboard tutorial (nextjs.org/learn)", "type": "Interactive Tutorial"},
        "angular": {"resource": "Angular - The Complete Guide on Udemy", "type": "Online Course"},
        "vue": {"resource": "Vue School tutorials or Frontend Masters Vue path", "type": "Online Course"},
        # Backend
        "django": {"resource": "Django for Beginners book or Django Girls tutorial", "type": "Online Course"},
        "fastapi": {"resource": "FastAPI official documentation tutorials", "type": "Online Course"},
        "spring boot": {"resource": "Spring Framework & Spring Boot masterclass (Udemy)", "type": "Online Course"},
        "nodejs": {"resource": "The Complete Node.js Developer Course", "type": "Online Course"},
        # Databases
        "postgresql": {"resource": "SQL & PostgreSQL for Beginners (Udemy) or pgexercises.com", "type": "Practice Platform"},
        "mongodb": {"resource": "MongoDB University (free learning paths)", "type": "Online Course"},
        "redis": {"resource": "Redis University courses", "type": "Online Course"},
        # AI/ML
        "scikit-learn": {"resource": "Machine Learning with Python (Coursera / IBM)", "type": "Online Course"},
        "tensorflow": {"resource": "DeepLearning.AI TensorFlow Developer Certificate", "type": "Certification"},
        "pytorch": {"resource": "PyTorch for Deep Learning Bootcamp (freeCodeCamp)", "type": "Online Course"},
        "langchain": {"resource": "LangChain for LLM Application Development (DeepLearning.AI)", "type": "Online Course"},
        "openai": {"resource": "Building Systems with the ChatGPT API (DeepLearning.AI)", "type": "Online Course"},
        # Testing
        "unit testing": {"resource": "PyTest / Jest testing guides and Mocking tutorials", "type": "Practice Platform"},
        "tdd": {"resource": "Test-Driven Development in Python or JavaScript articles", "type": "Online Course"}
    }
    
    # 1. Specific skill recommendations
    added_recs = 0
    for category, skills in categorized_missing.items():
        for skill in skills:
            skill_lower = skill.lower()
            if skill_lower in skill_learning_map and added_recs < 5:
                mapping = skill_learning_map[skill_lower]
                recs.append({
                    "skill": skill,
                    "action": f"Acquire foundational knowledge in {skill}. We recommend: {mapping['resource']}.",
                    "type": mapping["type"]
                })
                added_recs += 1
                
    # 2. General category recommendations if specific ones are exhausted
    if len(recs) < 3:
        for category, skills in categorized_missing.items():
            if skills and len(recs) < 5:
                sample_skills = ", ".join(skills[:3])
                recs.append({
                    "skill": f"General {category}",
                    "action": f"Add projects to your portfolio demonstrating experience in {category} skills such as: {sample_skills}.",
                    "type": "Portfolio Project"
                })
                
    # 3. Structural advice
    if ats_score < 60:
        recs.append({
            "skill": "Resume Re-formatting",
            "action": "Ensure you use standard section headers ('Skills', 'Experience', 'Education') and tailor your summary section to match the job's title and keywords.",
            "type": "Optimization"
        })
        
    return recs
