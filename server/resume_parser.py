import re
from typing import Dict, List, Any

def parse_resume_data(text: str) -> Dict[str, Any]:
    """
    Parses metadata fields from raw resume text:
    - Candidate Name (heuristic-based)
    - Email Address (regex-based)
    - Phone Number (regex-based)
    - Education Highlights (keyword filters)
    - Experience Milestones (keyword filters)
    - Certifications (keyword filters)
    - Projects (keyword filters)
    """
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # 1. Parse Email
    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, text)
    email = emails[0] if emails else "Not detected"
    
    # 2. Parse Phone
    phone_pattern = r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'
    phones = re.findall(phone_pattern, text)
    phone = phones[0] if phones else "Not detected"
    
    # 3. Parse Name: First line if it's not contact info or too long
    candidate_name = "Not detected"
    if lines:
        for line in lines[:3]:
            # Clean up line
            clean_line = re.sub(r'[^a-zA-Z\s]', '', line).strip()
            # If line is short and doesn't look like contact details
            if 3 < len(clean_line) < 30 and "@" not in line and not any(p in line for p in ["http", "github", "linkedin"]):
                candidate_name = line
                break
        # Fallback if first few lines failed
        if candidate_name == "Not detected" and lines:
            candidate_name = lines[0]

    # 4. Parse Education lines
    edu_indicators = ['university', 'college', 'degree', 'bachelor', 'master', 'b.s', 'b.tech', 'm.s', 'ph.d', 'education', 'academic', 'gpa']
    education = []
    for line in lines:
        if any(indicator in line.lower() for indicator in edu_indicators) and len(line) < 100:
            if line not in education:
                education.append(line)
                
    # 5. Parse Experience lines
    exp_indicators = ['developer', 'engineer', 'analyst', 'manager', 'lead', 'intern', 'experience', 'employment', 'work history', 'architect']
    experience = []
    for line in lines:
        if any(indicator in line.lower() for indicator in exp_indicators) and not any(ind in line.lower() for ind in edu_indicators) and line != candidate_name:
            if len(line) < 100 and line not in experience:
                experience.append(line)
                
    # 6. Parse Certifications
    cert_indicators = ['certified', 'certification', 'aws certified', 'pmp', 'scrum master', 'scrummaster', 'ccna', 'solutions architect', 'credentials']
    certifications = []
    for line in lines:
        if any(indicator in line.lower() for indicator in cert_indicators) and len(line) < 100:
            if line not in certifications:
                certifications.append(line)
                
    # 7. Parse Projects
    proj_indicators = ['project', 'projects', 'portfolio', 'application', 'system', 'platform']
    projects = []
    in_project_section = False
    
    for line in lines:
        line_lower = line.lower()
        if 'project' in line_lower and ('key' in line_lower or 'personal' in line_lower or 'recent' in line_lower or len(line) < 30):
            in_project_section = True
            continue
        elif any(sec in line_lower for sec in ['experience', 'work', 'education', 'summary', 'skills']):
            in_project_section = False
            
        if in_project_section and (line.startswith('-') or line.startswith('*') or len(line) < 80):
            clean_proj = re.sub(r'^[-*\s]+', '', line).strip()
            if clean_proj and len(clean_proj) > 5 and clean_proj not in projects:
                projects.append(clean_proj)
                
    # Fallback search if project section logic didn't hit
    if not projects:
        for line in lines:
            if any(ind in line.lower() for ind in proj_indicators) and not any(ind in line.lower() for ind in edu_indicators + exp_indicators) and len(line) < 80:
                clean_proj = re.sub(r'^[-*\s]+', '', line).strip()
                if clean_proj not in projects:
                    projects.append(clean_proj)
                    
    return {
        "candidate_name": candidateNameClean(candidate_name),
        "email": email,
        "phone": phone,
        "education": education[:3],      # Top 3 education listings
        "experience": experience[:4],    # Top 4 experience listings
        "certifications": certifications[:3], # Top 3 certifications
        "projects": projects[:3]          # Top 3 projects
    }

def candidateNameClean(name: str) -> str:
    """Helper to clean name text from common email/phone prefixes on same line."""
    name = re.sub(r'\|.*', '', name)
    name = re.sub(r'\b(email|phone|github|linkedin).*', '', name, flags=re.IGNORECASE)
    return name.strip()
