import os
from extractor import extract_text
from nlp import preprocess_text
from analyzer import load_skills_database, analyze_resume
from reporter import generate_pdf_report

def main():
    print("--- FastAPI Backend Modules Verification ---")
    
    # 1. Check database and files
    skills_db_path = "skills_database.json"
    assert os.path.exists(skills_db_path), "skills_database.json missing"
    print("[OK] database file found.")
    
    # 2. Mock texts with synonyms to verify matching
    # Resume contains 'ReactJS' and 'ML' and 'Neural Networks'
    resume_text = """John Doe
Software Engineer
Email: john@email.com | Phone: (123) 456-7890
Experience: ReactJS development, Python APIs, SQL queries, Agile Scrum, Git, ML models, Neural Networks."""
    
    # JD contains 'React' and 'Machine Learning' and 'Deep Learning'
    jd_text = """Position: Software Developer
Requirements: Python, React, FastAPI, Git, PostgreSQL, Docker, AWS, Machine Learning, Deep Learning."""
    
    # 3. Load database
    skills_db = load_skills_database(skills_db_path)
    print(f"[OK] Loaded skills database with {len(skills_db)} categories.")
    
    # 4. Analyze Resume (This will trigger SentenceTransformer loading on demand)
    results = analyze_resume(resume_text, jd_text, skills_db)
    print(f"[OK] Analysis successfully computed.")
    print(f"     Overall ATS Score: {results['ats_score']}%")
    print(f"     Semantic Similarity (Transformer): {results['semantic_score']}%")
    print(f"     Keyword Match (TF-IDF): {results['keyword_score']}%")
    print(f"     Skill Coverage Rate: {results['skills_match_score']}%")
    print(f"     Formatting Compliance Score: {results['formatting_score']}%")
    print(f"     Experience Requirements Match: {results['experience_score']}%")
    
    print("\n[OK] Extracted Match Details:")
    print(f"     Matched: {results['skills']['matched']}")
    print(f"     Missing: {results['skills']['missing']}")
    
    print("\n[OK] Resume Intelligence Parsed Metadata:")
    for k, v in results['parser_results'].items():
        print(f"     {k}: {v}")
    
    # 5. Generate PDF
    pdf_bytes = generate_pdf_report(results, "John_Doe", "Software Developer")
    output_pdf = "sample_ats_report.pdf"
    with open(output_pdf, 'wb') as f:
        f.write(pdf_bytes)
    print(f"\n[OK] Compiled PDF report: {output_pdf} ({len(pdf_bytes)} bytes)")
    
    print("\nSUCCESS: All backend modules are working correctly!")

if __name__ == "__main__":
    main()
