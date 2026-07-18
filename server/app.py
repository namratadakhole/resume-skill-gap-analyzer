from fastapi import FastAPI, Request, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from typing import Dict, Optional, Any, List
import io
import os
import time
from datetime import datetime

# Models & Extractor
from extractor import extract_text
from analyzer import load_skills_database, analyze_resume
from reporter import generate_pdf_report

# MongoDB Modular DB Layer
from database import (
    client,
    users_collection,
    resumes_collection,
    analyses_collection,
    reports_collection,
    interview_sessions_collection
)
from schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    UserUpdate,
    Token,
    ResumeResponse,
    AnalysisCreate,
    AnalysisResponse,
    ReportResponse,
    InterviewCreate,
    InterviewResponse
)
import crud
from auth import hash_password, verify_password, create_access_token, get_current_user

app = FastAPI(
    title="Resume Skill Gap Analyzer API",
    description="Secure MongoDB Database-Backed API for ATS Evaluations, NLP Analysis, and Profile Audits",
    version="2.0.0"
)

# Enable CORS for React frontend (Vite default is http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://resume-skill-gap-analyzer-eta.vercel.app",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_timing_and_cache_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    print(f"[TIMING] {request.method} {request.url.path} completed in {process_time:.4f}s")
    return response

# Global variables/State
SKILLS_DB_PATH = "skills_database.json"
skills_db = load_skills_database(SKILLS_DB_PATH)

@app.on_event("startup")
async def startup_event():
    """Warm up SentenceTransformer model cache, verify database connection, and ensure uploads folder exists on startup."""
    os.makedirs("uploads", exist_ok=True)
    
    # Verify MongoDB Atlas Connection
    try:
        await client.admin.command('ping')
        print("Connected to MongoDB Atlas successfully.")
        
        # Create database collection indexes
        print("Ensuring database indexes...")
        try:
            await users_collection.create_index("email", unique=True)
            await resumes_collection.create_index([("user_id", 1), ("is_active", 1)])
            await analyses_collection.create_index("user_id")
            await reports_collection.create_index("user_id")
            await interview_sessions_collection.create_index("user_id")
            print("Database indexes ensured successfully.")
        except Exception as idx_err:
            print(f"Warning: Failed to ensure database indexes: {str(idx_err)}")
    except Exception as e:
        import requests
        print(f"[STARTUP WARNING] MongoDB Atlas connection failed: {str(e)}")
        print("The backend server will remain running, but database dependent requests will fail.")
        try:
            public_ip = requests.get("https://api.ipify.org", timeout=5).text.strip()
            print("\n" + "="*80)
            print(f" [CRITICAL] Your Render instance public IP address is: {public_ip}")
            print(" Please add this IP to your MongoDB Atlas Network Access rules:")
            print(" Security -> Network Access -> Add IP Address -> Add Current IP Address")
            print(" (Or add 0.0.0.0/0 to allow connections from anywhere for testing)")
            print("="*80 + "\n")
        except Exception:
            pass
        # Do not call sys.exit(1) to avoid failing the Render container boot.
        
    import threading
    def background_tasks():
        # Defer NLTK downloading to background thread to prevent blocking module imports
        from nlp import download_nltk_resources
        print("[STARTUP] Starting NLTK resources download in background thread...")
        download_nltk_resources()
        print("[STARTUP] NLTK resources background download checks completed.")
        
        # NOTE: SentenceTransformer loading is completely deferred to on-demand request usage
        # to ensure zero GIL blocking or high CPU contention during server startup.
        print("[STARTUP] SentenceTransformer model pre-warming disabled for instant startup.")
    
    threading.Thread(target=background_tasks, daemon=True).start()

# Helper to serialize MongoDB documents (converting ObjectIds and datetimes)
def serialize_doc(doc: dict) -> dict:
    if not doc:
        return {}
    serialized = doc.copy()
    if "_id" in serialized:
        serialized["id"] = str(serialized.pop("_id"))
    if "user_id" in serialized:
        serialized["user_id"] = str(serialized["user_id"])
    for k, v in serialized.items():
        if isinstance(v, datetime):
            serialized[k] = v.isoformat()
    return serialized

# --- Authentication Endpoints ---

@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister):
    """
    Registers a new user, hashes their password, and saves them to MongoDB.
    """
    print(f"[AUTH] Registration request received for email: {payload.email}")
    existing_user = await crud.get_user_by_email(payload.email)
    if existing_user:
        print(f"[AUTH WARNING] Registration rejected: user {payload.email} already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    hashed = await run_in_threadpool(hash_password, payload.password)
    try:
        new_user = await crud.create_user(payload.name, payload.email, hashed)
        print(f"[AUTH] User {payload.email} created in database. Generating JWT...")
        token = create_access_token(data={"sub": payload.email})
        print(f"[AUTH] Registration JWT generated successfully for: {payload.email}")
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": serialize_doc(new_user)
        }
    except Exception as e:
        print(f"[AUTH ERROR] Registration failed for {payload.email}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/auth/login")
async def login(payload: UserLogin):
    """
    Authenticates user credentials and returns a JWT access token.
    """
    print(f"[AUTH] Login request received for email: {payload.email}")
    user = await crud.get_user_by_email(payload.email)
    
    if not user:
        print(f"[AUTH] Login failed: user with email {payload.email} not found in database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password."
        )
        
    print(f"[AUTH] User {payload.email} found in database. Verifying password...")
    is_valid = await run_in_threadpool(verify_password, payload.password, user["password_hash"])
    
    if not is_valid:
        print(f"[AUTH] Login failed: password mismatch for email {payload.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email address or password."
        )
        
    print(f"[AUTH] Password verification passed for: {payload.email}. Generating JWT...")
    try:
        token = create_access_token(data={"sub": user["email"]})
        print(f"[AUTH] Login JWT generated successfully for: {payload.email}")
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": serialize_doc(user)
        }
    except Exception as e:
        print(f"[AUTH ERROR] JWT token generation failed for {payload.email}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate secure session: {str(e)}"
        )

@app.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Returns the currently logged in user profile.
    """
    return serialize_doc(current_user)

@app.put("/auth/profile", response_model=UserResponse)
async def update_profile(payload: UserUpdate, current_user: dict = Depends(get_current_user)):
    """
    Updates the active user's profile details.
    """
    update_data = {k: v for k, v in payload.dict().items() if v is not None}
    if update_data:
        updated = await crud.update_user_profile(str(current_user["_id"]), update_data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user profile in database."
            )
        return serialize_doc(updated)
    return serialize_doc(current_user)

@app.post("/auth/logout")
async def logout():
    """
    API placeholder for logging out. Invalidation is handled client-side.
    """
    return {"status": "success", "detail": "Logged out successfully"}

# --- Secured Resume Management CRUD ---

@app.post("/api/resumes/upload", response_model=ResumeResponse)
async def upload_resume_file(
    file: UploadFile = File(...),
    target_role: Optional[str] = "Not set",
    current_user: dict = Depends(get_current_user)
):
    """
    Uploads a resume file, saves physical file inside uploads/, extracts text, and registers metadata in MongoDB.
    """
    try:
        contents = await file.read()
        file_size = len(contents)
        print(f"[UPLOAD] Received file: {file.filename}, content_type: {file.content_type}, size: {file_size} bytes")
        
        extracted_text = extract_text(contents, file.filename)
        text_len = len(extracted_text)
        word_count = len(extracted_text.split())
        first_200 = extracted_text[:200]
        print(f"[UPLOAD] Extracted text from {file.filename}. Size: {file_size} bytes, Text Length: {text_len} chars, Word Count: {word_count}. First 200 chars: {repr(first_200)}")
        
        clean_role = target_role or "Not set"
        
        # Calculate auto-incrementing version
        existing = await crud.get_resumes_by_user(str(current_user["_id"]))
        matching_name_count = sum(1 for r in existing if r["filename"] == file.filename)
        version = f"v{matching_name_count + 1}"
        
        # Save file physically inside server/uploads/
        os.makedirs("uploads", exist_ok=True)
        file_ext = os.path.splitext(file.filename)[1] or ".txt"
        unique_name = f"{str(current_user['_id'])}_{int(datetime.utcnow().timestamp())}{file_ext}"
        filepath = os.path.join("uploads", unique_name)
        with open(filepath, "wb") as f:
            f.write(contents)
            
        # Create DB record
        db_resume = await crud.create_resume(
            user_id=str(current_user["_id"]),
            filename=file.filename,
            filepath=filepath,
            text=extracted_text,
            word_count=word_count,
            target_role=clean_role,
            version=version,
            is_active=len(existing) == 0  # Automatically active if first upload
        )
        return serialize_doc(db_resume)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file upload: {str(e)}")

@app.get("/api/resumes", response_model=List[ResumeResponse])
async def get_resumes(current_user: dict = Depends(get_current_user)):
    """
    Retrieves all resumes metadata for the active logged-in user.
    """
    resumes = await crud.get_resumes_by_user(str(current_user["_id"]))
    return [serialize_doc(r) for r in resumes]

class RenameRequest(BaseModel):
    new_filename: str

@app.put("/api/resumes/{id}/rename", response_model=ResumeResponse)
async def rename_resume_file(
    id: str,
    payload: RenameRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Renames the filename metadata coordinates of the target resume.
    """
    updated = await crud.rename_resume(str(current_user["_id"]), id, payload.new_filename)
    if not updated:
        raise HTTPException(status_code=404, detail="Resume item not found or unauthorized.")
    return serialize_doc(updated)

@app.delete("/api/resumes/{id}")
async def delete_resume_file(id: str, current_user: dict = Depends(get_current_user)):
    """
    Deletes the target resume metadata and removes the physical file from uploads/.
    """
    deleted = await crud.delete_resume(str(current_user["_id"]), id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Resume item not found or unauthorized.")
        
    # Delete from file system
    filepath = deleted.get("filepath")
    if filepath and os.path.exists(filepath):
        try:
            os.remove(filepath)
        except Exception as e:
            print(f"Failed to delete disk file: {filepath}. Error: {e}")
            
    return {"status": "success", "detail": "Resume deleted successfully."}

@app.get("/api/resumes/{id}/download")
async def download_resume_file(id: str, current_user: dict = Depends(get_current_user)):
    """
    Streams the original resume document file back to the browser.
    """
    resume = await crud.get_resume_by_id(str(current_user["_id"]), id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found or unauthorized.")
        
    filepath = resume.get("filepath")
    if not filepath or not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Original document file not found on disk.")
        
    return FileResponse(
        filepath,
        media_type="application/octet-stream",
        filename=resume["filename"]
    )

@app.post("/api/resumes/{id}/active", response_model=ResumeResponse)
async def set_active_resume_file(id: str, current_user: dict = Depends(get_current_user)):
    """
    Sets the target resume as active for the workspace.
    """
    updated = await crud.set_active_resume(str(current_user["_id"]), id)
    if not updated:
        raise HTTPException(status_code=404, detail="Resume item not found or unauthorized.")
    return serialize_doc(updated)

# --- Secured Audit Analyses Endpoints ---

class ReportRequest(BaseModel):
    analysis: Dict[str, Any]
    resume_name: str
    job_title: str

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(payload: AnalysisCreate, current_user: dict = Depends(get_current_user)):
    """
    Performs NLP analysis, supporting either dynamic input text or loading text from db by resume_id.
    """
    start_time = time.time()
    print(f"[{datetime.now().isoformat()}] [API /api/analyze] Received analysis request for user: {current_user.get('email')}")
    
    # 1. Fetch text from selected resume if resume_id is passed
    resume_text = ""
    resume_filename = "Active_Resume.txt"
    
    if payload.resume_id:
        print(f"[{datetime.now().isoformat()}] [API /api/analyze] Fetching resume text by ID: {payload.resume_id}")
        db_resume = await crud.get_resume_by_id(str(current_user["_id"]), payload.resume_id)
        if not db_resume:
            raise HTTPException(status_code=404, detail="Selected database resume not found.")
        resume_text = db_resume.get("text", "")
        resume_filename = db_resume.get("filename", "Active_Resume.txt")
    else:
        resume_text = payload.resume_text or ""
        
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Resume text content cannot be empty.")
    if not payload.job_desc_text.strip():
        raise HTTPException(status_code=400, detail="Job description content cannot be empty.")
        
    try:
        print(f"[{datetime.now().isoformat()}] [API /api/analyze] Running analyze_resume in threadpool (Resume len: {len(resume_text)}, JobDesc len: {len(payload.job_desc_text)})...")
        # Run calculation in threadpool to prevent blocking the event loop
        analysis_result = await run_in_threadpool(
            analyze_resume,
            resume_text, 
            payload.job_desc_text, 
            skills_db, 
            payload.weights
        )
        print(f"[{datetime.now().isoformat()}] [API /api/analyze] NLP calculation complete. ATS Score: {analysis_result.get('ats_score')}%. Saving analysis record to MongoDB...")
        
        # Extract title
        first_line = payload.job_desc_text.split('\n')[0] or ''
        job_title = first_line.replace('Position:', '').replace('Role:', '').replace('Company:', '').strip() or 'Software Developer'
        
        # Save to MongoDB
        db_analysis = await crud.create_analysis(
            user_id=str(current_user["_id"]),
            resume_filename=resume_filename,
            job_title=job_title,
            ats_score=analysis_result["ats_score"],
            semantic_score=analysis_result["semantic_score"],
            keyword_score=analysis_result["keyword_score"],
            skills_match_score=analysis_result["skills_match_score"],
            formatting_score=analysis_result["formatting_score"],
            experience_score=analysis_result["experience_score"],
            results=analysis_result
        )
        
        # If resume_id was passed, update the resume document score & target role
        if payload.resume_id:
            await crud.update_resume_score(
                user_id=str(current_user["_id"]),
                resume_id=payload.resume_id,
                score=analysis_result["ats_score"],
                target_role=job_title
            )
            
        elapsed = time.time() - start_time
        print(f"[{datetime.now().isoformat()}] [API /api/analyze SUCCESS] Analysis record saved & returned in {elapsed:.3f}s. Record ID: {db_analysis.get('_id')}")
        return serialize_doc(db_analysis)
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] [API /api/analyze ERROR] Failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis engine failed: {str(e)}")

@app.get("/api/analyses", response_model=List[AnalysisResponse])
async def get_analyses(current_user: dict = Depends(get_current_user)):
    """
    Retrieves all previous analyses logs belonging to the active user.
    """
    analyses = await crud.get_analyses_by_user(str(current_user["_id"]))
    return [serialize_doc(a) for a in analyses]

@app.delete("/api/analyses/{id}")
async def delete_analysis(id: str, current_user: dict = Depends(get_current_user)):
    """
    Deletes the target analysis item by ID under strict user-isolation.
    """
    success = await crud.delete_analysis_by_id(str(current_user["_id"]), id)
    if not success:
        raise HTTPException(status_code=404, detail="Analysis item not found or unauthorized.")
    return {"status": "success", "detail": "Analysis record deleted successfully."}

@app.post("/api/analyses/{id}/duplicate", response_model=AnalysisResponse)
async def duplicate_analysis(id: str, current_user: dict = Depends(get_current_user)):
    """
    Duplicates a previous analysis document, assigning a new timestamp in MongoDB.
    """
    try:
        from bson import ObjectId
        original = await analyses_collection.find_one({
            "_id": ObjectId(id),
            "user_id": str(current_user["_id"])
        })
        if not original:
            raise HTTPException(status_code=404, detail="Analysis record not found or unauthorized.")
        
        cloned = original.copy()
        del cloned["_id"]
        cloned["created_date"] = datetime.utcnow()
        
        result = await analyses_collection.insert_one(cloned)
        cloned["_id"] = result.inserted_id
        return serialize_doc(cloned)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to duplicate analysis: {str(e)}")

@app.post("/api/download_report")
async def download_report(payload: ReportRequest, current_user: dict = Depends(get_current_user)):
    """
    Generates PDF report bytes and logs metadata to the reports collection.
    """
    try:
        # Save log in db
        await crud.create_report_log(
            user_id=str(current_user["_id"]),
            filename=f"{payload.resume_name}_ATS_Report.pdf",
            resume_name=payload.resume_name,
            job_title=payload.job_title,
            ats_score=payload.analysis.get("ats_score", 0)
        )
        
        pdf_bytes = generate_pdf_report(
            payload.analysis, 
            payload.resume_name, 
            payload.job_title
        )
        
        pdf_stream = io.BytesIO(pdf_bytes)
        filename = f"{payload.resume_name}_ATS_Report.pdf"
        
        return StreamingResponse(
            pdf_stream,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report PDF: {str(e)}")

@app.get("/api/reports", response_model=List[ReportResponse])
async def get_reports(current_user: dict = Depends(get_current_user)):
    """
    Retrieves metadata of generated PDF reports for the active user.
    """
    reports = await crud.get_reports_by_user(str(current_user["_id"]))
    return [serialize_doc(r) for r in reports]

@app.delete("/api/reports/{id}")
async def delete_report(id: str, current_user: dict = Depends(get_current_user)):
    """
    Deletes the target report log metadata under strict user-isolation.
    """
    success = await crud.delete_report_log(str(current_user["_id"]), id)
    if not success:
        raise HTTPException(status_code=404, detail="Report item not found or unauthorized.")
    return {"status": "success", "detail": "Report deleted successfully."}

@app.post("/api/reports/{id}/download-track", response_model=ReportResponse)
async def download_track(id: str, current_user: dict = Depends(get_current_user)):
    """
    Tracks downloads of reports by incrementing the download count.
    """
    updated = await crud.increment_report_download(str(current_user["_id"]), id)
    if not updated:
        raise HTTPException(status_code=404, detail="Report item not found or unauthorized.")
    return serialize_doc(updated)

# --- Secured Interview Sessions Chat log ---

@app.post("/api/interview_sessions", response_model=InterviewResponse)
async def create_chat_session(payload: InterviewCreate, current_user: dict = Depends(get_current_user)):
    """
    Logs an exchange between the candidate and the AI Resume Coach.
    """
    db_chat = await crud.create_interview_session(
        user_id=str(current_user["_id"]),
        query=payload.query,
        response=payload.response
    )
    return serialize_doc(db_chat)

@app.get("/api/interview_sessions", response_model=List[InterviewResponse])
async def get_chat_sessions(current_user: dict = Depends(get_current_user)):
    """
    Retrieves chat history log exchanges for the active user.
    """
    sessions = await crud.get_interview_sessions_by_user(str(current_user["_id"]))
    return [serialize_doc(s) for s in sessions]

import re
from schemas import (
    UserRegister,
    UserLogin,
    UserResponse,
    UserUpdate,
    Token,
    ResumeResponse,
    AnalysisCreate,
    AnalysisResponse,
    ReportResponse,
    InterviewCreate,
    InterviewResponse,
    RewriteCreate,
    RewriteResponse,
    InterviewPrepCreate,
    InterviewPrepResponse,
    ProjectRecommendationCreate,
    ProjectRecommendationResponse,
    MockInterviewCreate,
    AnswerSubmission,
    QuestionEvaluation,
    MockInterviewResponse,
    QuestionRequest,
    AnswerSubmissionUpgraded,
    AnalyzeRequest,
    EndInterviewRequest
)

@app.post("/api/rewrites", response_model=RewriteResponse)
async def generate_rewrite(payload: RewriteCreate, current_user: dict = Depends(get_current_user)):
    """
    Executes rule-based rewrite of resume sections to optimize keywords, summaries, experience, projects, and achievements.
    """
    try:
        analysis = payload.analysis_results
        matched_skills = analysis.get("skills", {}).get("matched", [])
        missing_skills = analysis.get("skills", {}).get("missing", [])
        
        if not isinstance(matched_skills, list): matched_skills = []
        if not isinstance(missing_skills, list): missing_skills = []
        
        sections = [
            {"name": "Professional Summary", "regex": r"(?i)(?:summary|professional summary|about me|profile|objective)"},
            {"name": "Skills", "regex": r"(?i)(?:skills|technical skills|core competencies|technologies)"},
            {"name": "Projects", "regex": r"(?i)(?:projects|personal projects|key projects|academic projects)"},
            {"name": "Experience", "regex": r"(?i)(?:experience|work experience|employment|history|professional experience)"},
            {"name": "Achievements", "regex": r"(?i)(?:achievements|awards|accomplishments)"}
        ]
        
        text = payload.resume_text or ""
        lines = text.split("\n")
        
        extracted = {}
        current_section = "General"
        extracted[current_section] = []
        
        for line in lines:
            line_clean = line.strip()
            if not line_clean:
                continue
            matched_header = False
            if len(line_clean) < 35:
                for s in sections:
                    if re.search(s["regex"], line_clean):
                        current_section = s["name"]
                        if current_section not in extracted:
                            extracted[current_section] = []
                        matched_header = True
                        break
            if not matched_header:
                extracted[current_section].append(line_clean)
                
        original_sections = {}
        for s in sections:
            name = s["name"]
            orig_lines = extracted.get(name, [])
            original_sections[name] = "\n".join(orig_lines) if orig_lines else f"Dedicated {name} details not explicitly found."

        preferred_role = current_user.get("preferred_job_role") or "Software Engineer"
        experience_level = current_user.get("experience_level") or "Mid Level"
        
        rewritten_sections = []
        
        # 1. Summary
        matched_str = ", ".join(matched_skills[:4]) if matched_skills else "software engineering fundamentals"
        missing_str = ", ".join(missing_skills[:3]) if missing_skills else "advanced system architectures"
        
        summary_original = original_sections["Professional Summary"]
        summary_improved = (
            f"Results-oriented {preferred_role} with {experience_level} of experience specializing in "
            f"scalable application engineering and cloud infrastructure. Demonstrated proficiency in {matched_str}, "
            f"with strong capabilities in {missing_str}. Adept at partnering with cross-functional product teams "
            f"to architect high-performance, containerized services and accelerate agile delivery cycles."
        )
        rewritten_sections.append({
            "name": "Professional Summary",
            "original_text": summary_original,
            "improved_text": summary_improved,
            "changes_made": [
                "Aligned title positioning to target job role.",
                "Injected matching core competencies.",
                "Synthesized missing skills directly into summary coordinates."
            ],
            "ats_impact": "Injecting missing skills directly in the summary maximizes the frequency weight calculated by scanning parsers."
        })
        
        # 2. Skills
        all_skills = sorted(list(set(matched_skills + missing_skills)))
        skills_original = original_sections["Skills"]
        skills_improved = (
            f"Languages & Core: {', '.join([s for s in all_skills[:6]])}\n"
            f"Frameworks & Tools: {', '.join([s for s in all_skills[6:12]])}\n"
            f"Databases & Cloud: {', '.join([s for s in all_skills[12:]])}"
        ) if len(all_skills) > 4 else f"Core Competencies: {', '.join(all_skills)}"
        
        rewritten_sections.append({
            "name": "Skills",
            "original_text": skills_original,
            "improved_text": skills_improved,
            "changes_made": [
                "Categorized core skills into distinct categories (Languages, Frameworks, Cloud).",
                "Appended missing critical skills: " + ", ".join(missing_skills[:5])
            ],
            "ats_impact": "Aligns section metadata with standard parser headings and plugs skills gap coordinates completely."
        })
        
        # 3. Projects
        proj_skill_1 = missing_skills[0] if len(missing_skills) > 0 else "FastAPI"
        proj_skill_2 = missing_skills[1] if len(missing_skills) > 1 else "Docker"
        projects_original = original_sections["Projects"]
        projects_improved = (
            f"Distributed Matching Pipeline Engine\n"
            f"- Architected an asynchronous event-driven matching service utilizing Python, {proj_skill_1}, and MongoDB.\n"
            f"- Standardized deployments using containerized {proj_skill_2} configurations, boosting server setup times by 38%.\n"
            f"- Decreased API response latencies by 24% through query index optimizations."
        )
        rewritten_sections.append({
            "name": "Projects",
            "original_text": projects_original,
            "improved_text": projects_improved,
            "changes_made": [
                "Implemented STAR technique structure.",
                "Injected missing gap technologies: " + f"{proj_skill_1}, {proj_skill_2}.",
                "Quantified achievements with impact percentages."
            ],
            "ats_impact": "Adding project scope details demonstrating missing tech usage satisfies experience constraints in parser semantic engines."
        })
        
        # 4. Experience
        exp_original = original_sections["Experience"]
        exp_improved = (
            f"Senior Software Engineer | Technology Solutions Corp\n"
            f"- Engineered backend cloud API endpoints, scaling microservices throughput by 45%.\n"
            f"- Integrated distributed database collections reducing query runtimes by 30%.\n"
            f"- Coached 3 junior engineers on clean-code patterns and unit testing."
        )
        rewritten_sections.append({
            "name": "Experience",
            "original_text": exp_original,
            "improved_text": exp_improved,
            "changes_made": [
                "Started all bullet points with strong action verbs (Engineered, Integrated, Coached).",
                "Incorporated metric metrics verifying professional scope."
            ],
            "ats_impact": "Semantic parsers score action-verb bullet points higher than passive descriptive blocks."
        })

        # 5. Achievements
        ach_original = original_sections["Achievements"]
        ach_improved = (
            f"- Promoted to Senior Engineer within 14 months for outstanding architecture contributions.\n"
            f"- Received Corporate Innovator Award for optimizing cloud system architectures.\n"
            f"- Delivered 2 high-impact migration projects 3 weeks ahead of scheduled deadline."
        )
        rewritten_sections.append({
            "name": "Achievements",
            "original_text": ach_original,
            "improved_text": ach_improved,
            "changes_made": [
                "Recast accomplishments as quantifiable bullets.",
                "Highlighted timeline performance."
            ],
            "ats_impact": "Including dedicated achievement headers validates formatting checks and highlights leadership value."
        })
        
        db_rewrite = await crud.create_rewrite_history(
            user_id=str(current_user["_id"]),
            resume_name=payload.resume_name,
            sections=rewritten_sections
        )
        return serialize_doc(db_rewrite)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate resume rewrite: {str(e)}")

@app.get("/api/rewrites", response_model=List[RewriteResponse])
async def get_rewrites(current_user: dict = Depends(get_current_user)):
    """
    Fetches the history of AI rewrites generated by the logged-in candidate.
    """
    rewrites = await crud.get_rewrites_by_user(str(current_user["_id"]))
    return [serialize_doc(r) for r in rewrites]

# --- Secured Interview Preparation Endpoints ---

QUESTION_BANK = {
    "docker": [
        {"question": "What is Docker?", "answer": "Docker is an open-source platform that automates the deployment, scaling, and management of applications inside lightweight, portable containers.", "level": "Beginner"},
        {"question": "Explain the difference between a Docker image and a container.", "answer": "A Docker image is a read-only template that contains the instructions to build a container. A container is a runnable, isolated instance of that image.", "level": "Beginner"},
        {"question": "What is a Dockerfile and what are some common directives?", "answer": "A Dockerfile is a script composed of sequential instructions used to assemble an image. Directives include FROM, RUN, COPY, EXPOSE, and CMD.", "level": "Intermediate"},
        {"question": "What is Docker Compose?", "answer": "Docker Compose is a tool for defining and running multi-container applications using a single YAML configuration file.", "level": "Intermediate"},
        {"question": "How does Docker networking work internally?", "answer": "Docker utilizes Network Drivers (Bridge, Host, Overlay, Macvlan, None) to configure isolated container networks and expose interfaces to hosts.", "level": "Advanced"},
        {"question": "How do you achieve zero-downtime rolling updates in container deployments?", "answer": "Through container orchestration platforms (like Swarm or Kubernetes) that spin up new containers, verify health probes, and reroute network traffic before stopping old containers.", "level": "Advanced"}
    ],
    "kubernetes": [
        {"question": "What is Kubernetes?", "answer": "Kubernetes is an open-source container orchestration engine designed to automate deployment, scaling, and operational management of containerized workloads.", "level": "Beginner"},
        {"question": "What is a Pod in Kubernetes?", "answer": "A Pod is the smallest deployable execution unit in Kubernetes, hosting one or more tightly coupled containers sharing network and storage resources.", "level": "Beginner"},
        {"question": "Explain the difference between a Deployment and a StatefulSet.", "answer": "Deployments manage stateless containers with random naming, whereas StatefulSets manage stateful containers with persistent names and ordered rollouts.", "level": "Intermediate"},
        {"question": "What is a Kubernetes Service?", "answer": "A Service is an abstraction defining a logical set of Pods and a policy to access them, providing load balancing and stable virtual IPs.", "level": "Intermediate"},
        {"question": "Explain the role of the etcd cluster inside the Control Plane.", "answer": "etcd is a highly-available, distributed key-value store used to preserve all Kubernetes cluster state coordination metadata.", "level": "Advanced"},
        {"question": "What are Admission Controllers?", "answer": "Admission Controllers are plugins that intercept api requests after authentication and schema checks, allowing mutations and validations before writing to etcd.", "level": "Advanced"}
    ],
    "fastapi": [
        {"question": "What is FastAPI?", "answer": "FastAPI is a modern, high-performance web framework for building APIs in Python, utilizing standard Python type hints.", "level": "Beginner"},
        {"question": "Explain async/await syntax in FastAPI.", "answer": "FastAPI natively supports asynchronous endpoints. Using async def allows the server to yield execution during I/O bound operations, increasing concurrency.", "level": "Beginner"},
        {"question": "What is Pydantic and how is it used in FastAPI?", "answer": "Pydantic is a data validation library. FastAPI uses Pydantic schemas to validate incoming JSON request payloads and serialize outgoing responses.", "level": "Intermediate"},
        {"question": "Explain Dependency Injection in FastAPI.", "answer": "FastAPI has a powerful Dependency Injection system using Depends(). It allows modularizing database sessions, security checks, and logic sharing.", "level": "Intermediate"},
        {"question": "How does ASGI differ from WSGI?", "answer": "WSGI is synchronous and handles single request-response cycles. ASGI is asynchronous, supporting concurrency, WebSockets, and background tasks.", "level": "Advanced"},
        {"question": "How would you handle global rate-limiting in a FastAPI application?", "answer": "Using middle-ware blocks or dependencies integrated with a Redis cache to count requests by client IP addresses over sliding time windows.", "level": "Advanced"}
    ]
}

def generate_dynamic_questions(skill: str) -> list:
    skill_clean = skill.capitalize()
    return [
        {"question": f"What is {skill_clean} and what are its primary use cases?", "answer": f"{skill_clean} is a technology widely utilized to solve engineering requirements in modern application stacks.", "level": "Beginner"},
        {"question": f"Explain the core architectural concepts of {skill_clean}.", "answer": f"The core architecture of {skill_clean} is built around modularity, separation of concerns, and efficient runtime execution.", "level": "Beginner"},
        {"question": f"What are the best practices for using {skill_clean} in a production environment?", "answer": f"Best practices focus on secure configuration management, load testing, comprehensive telemetry logging, and persistent backups.", "level": "Intermediate"},
        {"question": f"What are some common anti-patterns when deploying {skill_clean}?", "answer": f"Anti-patterns include mixing environments, storing plain credentials, neglecting scaling benchmarks, and ignoring exception trace logs.", "level": "Intermediate"},
        {"question": f"How do you debug and optimize performance issues in a {skill_clean} cluster?", "answer": f"Performance optimization involves caching queries, profiling resource pools, allocating memory limits, and analyzing trace metrics.", "level": "Advanced"},
        {"question": f"How would you design a highly available system using {skill_clean}?", "answer": f"A highly available design incorporates redundant active-passive zones, failover automated mechanisms, health checks, and global load balancing.", "level": "Advanced"}
    ]

@app.post("/api/interview_prep", response_model=InterviewPrepResponse)
async def generate_prep_guide(payload: InterviewPrepCreate, current_user: dict = Depends(get_current_user)):
    """
    Generates tailored interview preparation guides mapping missing skill metrics and job titles.
    """
    try:
        skills = payload.missing_skills or []
        if not skills:
            skills = ["System Design", "Scalability"]

        # 1. Generate Technical questions
        technical_questions = []
        for s in skills:
            key = s.lower().strip()
            # Try exact match or subset match
            q_list = None
            for bk in QUESTION_BANK.keys():
                if bk in key or key in bk:
                    q_list = QUESTION_BANK[bk]
                    break
            if not q_list:
                q_list = generate_dynamic_questions(s)
            
            technical_questions.append({
                "skill": s,
                "difficulty": "Medium" if len(s) % 2 == 0 else "Advanced",
                "prep_time": f"{3 + (len(s) % 4)} hours",
                "questions": q_list
            })

        # 2. Generate HR Questions
        hr_questions = [
            {"question": "Tell me about yourself and your background.", "answer": "Walk through your resume, highlighting software engineering milestones, and explain how you transition tech skills into business value."},
            {"question": "Why do you want to join our company?", "answer": "Align your target position with the company values, showing interest in the product stack and technical challenge scale."},
            {"question": "What are your greatest strengths and weaknesses?", "answer": "For weaknesses, discuss a genuine technical gap you recognized and are actively resolving (e.g. learning missing skills)."}
        ]

        # 3. Generate Behavioral Questions (STAR)
        behavioral_questions = [
            {"question": "Describe a time you resolved a major technical disagreement in your team.", "answer": "S: Team was divided on database indexing vs routing. T: We needed to fix performance bottleneck. A: I created benchmark scripts demonstrating MongoDB read/write speeds. R: The numbers settled the debate and query times dropped by 40%."},
            {"question": "Tell me about a project that failed and what you learned.", "answer": "S: Legacy backend migration timeline slipped. T: Relocate APIs to FastAPI. A: We didn't account for complex schema overrides. R: Swapped to incremental endpoints release. Learned to run mock schema migrations earlier."}
        ]

        # 4. Generate Coding Questions
        coding_questions = [
            {"question": "Write a function to verify if a string is a palindrome, ignoring non-alphanumeric characters.", "answer": "def is_palindrome(s: str) -> bool:\n    clean = [c.lower() for c in s if c.isalnum()]\n    return clean == clean[::-1]"},
            {"question": "Explain how garbage collection works inside Python.", "answer": "Python utilizes Reference Counting as its main garbage collection metric, supplemented by a generational cyclic garbage collector to detect circular references."}
        ]

        # Estimations
        difficulty_level = "Advanced" if len(skills) > 3 else "Medium"
        estimated_prep_time = f"{len(skills) * 3} hours total"

        top_tips = [
            "Structure behavioral answers using the STAR method (Situation, Task, Action, Result).",
            "Be transparent about what you don't know, and explain your logical process to deduce answers.",
            "Write syntax-clean code on whiteboards without helper IDE autocompletes."
        ]

        recommended_topics = [
            f"Review standard operations in {skills[0]}." if skills else "Data Structures",
            "Distributed Systems scalability architectures.",
            "Database normalization and indexes configuration."
        ]

        # Save log in database
        db_prep = await crud.create_interview_prep(
            user_id=str(current_user["_id"]),
            resume_name=payload.resume_name,
            job_title=payload.job_title,
            difficulty_level=difficulty_level,
            estimated_prep_time=estimated_prep_time,
            technical_questions=technical_questions,
            hr_questions=hr_questions,
            behavioral_questions=behavioral_questions,
            coding_questions=coding_questions,
            top_tips=top_tips,
            recommended_topics=recommended_topics
        )
        return serialize_doc(db_prep)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate interview prep guide: {str(e)}")

@app.get("/api/interview_prep", response_model=List[InterviewPrepResponse])
async def get_interview_preps(current_user: dict = Depends(get_current_user)):
    """
    Retrieves previous interview preparation logs generated by the active logged-in user.
    """
    preps = await crud.get_interview_preps_by_user(str(current_user["_id"]))
    return [serialize_doc(p) for p in preps]

# --- Secured Project Recommendations Endpoints ---

PROJECT_CATALOG = {
    "devops": [
        {
            "name": "Multi-Container Microservice Orchestration",
            "description": "Architect and containerize a three-tier web application, configuring bridge networks, volume mounts, and reverse proxies.",
            "technologies": ["Docker", "Docker Compose", "Nginx"],
            "difficulty": "Intermediate",
            "duration": "1 Week",
            "skills_covered": ["Docker", "Docker Compose", "Nginx"],
            "learning_outcome": "Understand isolated container networking, lifecycle directives, and reverse proxy routing.",
            "priority": "High",
            "github_readiness": 4
        },
        {
            "name": "Production-grade Kubernetes Scaling",
            "description": "Deploy stateless microservices using deployment templates, implementing stateful sets, persistence volumes, and helm packaging.",
            "technologies": ["Kubernetes", "Helm", "Minikube"],
            "difficulty": "Advanced",
            "duration": "2 Weeks",
            "skills_covered": ["Kubernetes", "Helm", "YAML"],
            "learning_outcome": "Master Kubernetes container orchestration, replicas management, and rolling upgrades.",
            "priority": "High",
            "github_readiness": 5
        },
        {
            "name": "CI/CD Deployment Automation Infrastructure",
            "description": "Automate linting, unit tests, and deployments to cloud runners whenever code commits. Set up test suites and registry triggers.",
            "technologies": ["GitHub Actions", "Docker Registry", "YAML"],
            "difficulty": "Intermediate",
            "duration": "1.5 Weeks",
            "skills_covered": ["GitHub Actions", "Docker Registry", "CI/CD"],
            "learning_outcome": "Configure automated build pipelines, integration webhooks, and registry security.",
            "priority": "Medium",
            "github_readiness": 4
        }
    ],
    "backend": [
        {
            "name": "Asynchronous Distributed Task Scheduler",
            "description": "Develop a background scheduling engine in FastAPI that yields execution threads and task payloads to celery workers over a Redis queue broker.",
            "technologies": ["FastAPI", "Redis", "Celery"],
            "difficulty": "Intermediate",
            "duration": "1.5 Weeks",
            "skills_covered": ["FastAPI", "Python", "Redis", "Celery"],
            "learning_outcome": "Optimize REST API performance, decouple heavy execution blocks, and master async handlers.",
            "priority": "High",
            "github_readiness": 5
        },
        {
            "name": "Secure JWT OAuth2 Authenticator Gateway",
            "description": "Build a stateless authentication microservice validating JSON Web Tokens, encrypting password hashes, and authorizing role routes.",
            "technologies": ["FastAPI", "PyJWT", "bcrypt"],
            "difficulty": "Intermediate",
            "duration": "1 Week",
            "skills_covered": ["FastAPI", "Python", "JWT"],
            "learning_outcome": "Understand cryptographic password hashing, stateless session tokens, and middleware validation blocks.",
            "priority": "High",
            "github_readiness": 4
        },
        {
            "name": "Real-time Analytics Socket Broadcast Server",
            "description": "Implement client bidirectional streaming sockets in FastAPI, broadcasting real-time system metrics to frontend subscribers.",
            "technologies": ["FastAPI", "WebSockets", "asyncio"],
            "difficulty": "Advanced",
            "duration": "2 Weeks",
            "skills_covered": ["FastAPI", "WebSockets", "asyncio"],
            "learning_outcome": "Manage parallel open WebSocket channels, concurrency parameters, and python event loops.",
            "priority": "Medium",
            "github_readiness": 4
        }
    ],
    "databases": [
        {
            "name": "Distributed Analytics Metadata Cache Layer",
            "description": "Create a database utility caching frequently read lookup keys in Redis and logging persistent documents to MongoDB.",
            "technologies": ["MongoDB", "Redis", "Python"],
            "difficulty": "Intermediate",
            "duration": "1.5 Weeks",
            "skills_covered": ["MongoDB", "Redis", "NoSQL"],
            "learning_outcome": "Configure read-through caching patterns, connection pools, and database document fallback logic.",
            "priority": "High",
            "github_readiness": 4
        },
        {
            "name": "Relational to document Database Sync Engine",
            "description": "Build a synchronization utility capturing transactional events through database logs and replication change streams.",
            "technologies": ["MongoDB", "PostgreSQL", "Python"],
            "difficulty": "Advanced",
            "duration": "2 Weeks",
            "skills_covered": ["MongoDB", "PostgreSQL", "Change Streams"],
            "learning_outcome": "Understand transactional replication, event-driven syncing, and dual database configurations.",
            "priority": "Medium",
            "github_readiness": 5
        },
        {
            "name": "High-Volume Logs Aggregation Query Engine",
            "description": "Ingest thousands of system log files, optimizing lookup speeds using compound compound indexes and aggregate projections.",
            "technologies": ["MongoDB", "NoSQL", "Python"],
            "difficulty": "Intermediate",
            "duration": "1 Week",
            "skills_covered": ["MongoDB", "Indexing", "NoSQL"],
            "learning_outcome": "Perform MongoDB query analysis, index tuning, and database analytics aggregates.",
            "priority": "Medium",
            "github_readiness": 4
        }
    ],
    "ml_ai": [
        {
            "name": "Face Mask Detection Pipeline",
            "description": "Train a Convolutional Neural Network (CNN) to classify facial masks, parsing webcam streams in real time.",
            "technologies": ["TensorFlow", "OpenCV", "CNN"],
            "difficulty": "Intermediate",
            "duration": "2 Weeks",
            "skills_covered": ["TensorFlow", "OpenCV", "CNN"],
            "learning_outcome": "Train neural network models, preprocess raw image matrix buffers, and overlay webcam annotations.",
            "priority": "High",
            "github_readiness": 5
        },
        {
            "name": "Real-Time Object Detector & Tracker",
            "description": "Deploy pre-trained YOLO parameters in OpenCV to highlight and track pedestrian movements in video feeds.",
            "technologies": ["OpenCV", "YOLO", "Python"],
            "difficulty": "Intermediate",
            "duration": "1.5 Weeks",
            "skills_covered": ["OpenCV", "YOLO", "Object Tracking"],
            "learning_outcome": "Utilize pre-trained model weights, parse neural output bounding coordinates, and calculate tracking vectors.",
            "priority": "High",
            "github_readiness": 4
        },
        {
            "name": "Neural Image Super-Resolution Transfer",
            "description": "Construct a Generative Adversarial Network (GAN) that enhances pixel resolution in low-quality picture inputs.",
            "technologies": ["TensorFlow", "GANs", "OpenCV"],
            "difficulty": "Advanced",
            "duration": "3 Weeks",
            "skills_covered": ["TensorFlow", "GANs", "OpenCV"],
            "learning_outcome": "Understand generative adversarial model training, loss functions, and image tensor operations.",
            "priority": "Medium",
            "github_readiness": 5
        }
    ]
}

def generate_dynamic_projects(skill: str) -> list:
    skill_clean = skill.capitalize()
    return [
        {
            "name": f"Interactive {skill_clean} Prototype Dashboard",
            "description": f"Build a robust user portal showcasing the primary functional workflows and APIs of {skill_clean}.",
            "technologies": [skill, "Python", "React"],
            "difficulty": "Intermediate",
            "duration": "1.5 Weeks",
            "skills_covered": [skill, "Full Stack"],
            "learning_outcome": f"Understand core configurations, endpoint mappings, and CRUD hooks using {skill_clean}.",
            "priority": "High",
            "github_readiness": 4
        },
        {
            "name": f"Enterprise Cluster Deployment of {skill_clean}",
            "description": f"Set up highly available instances of {skill_clean}, configuring auto-failover replication nodes and telemetry trackers.",
            "technologies": [skill, "Docker", "Kubernetes"],
            "difficulty": "Advanced",
            "duration": "2 Weeks",
            "skills_covered": [skill, "Infrastructure"],
            "learning_outcome": f"Configure cluster clusters, allocate replication profiles, and resolve nodes network routing.",
            "priority": "High",
            "github_readiness": 5
        },
        {
            "name": f"CI/CD testing pipeline integration for {skill_clean}",
            "description": f"Automate code checks and integrations tests asserting the reliable functionality of {skill_clean} modules.",
            "technologies": [skill, "GitHub Actions", "YAML"],
            "difficulty": "Intermediate",
            "duration": "1 Week",
            "skills_covered": [skill, "CI/CD"],
            "learning_outcome": "Automate integration regressions tests and monitor container builds.",
            "priority": "Medium",
            "github_readiness": 4
        }
    ]

@app.post("/api/project_recommendations", response_model=ProjectRecommendationResponse)
async def generate_projects(payload: ProjectRecommendationCreate, current_user: dict = Depends(get_current_user)):
    """
    Generates structured project ideas mapping missing skill coordinates. Recommends at least 3 projects per category.
    """
    try:
        missing_skills = payload.missing_skills or []
        if not missing_skills:
            missing_skills = ["Docker", "FastAPI"]

        # Group missing skills into catalog categories
        # Default category mapping
        categories_to_load = set()
        for s in missing_skills:
            s_low = s.lower().strip()
            if any(k in s_low for k in ["docker", "k8s", "kubernetes", "aws", "cloud", "devops", "actions"]):
                categories_to_load.add("devops")
            elif any(k in s_low for k in ["python", "fastapi", "django", "flask", "backend"]):
                categories_to_load.add("backend")
            elif any(k in s_low for k in ["mongodb", "nosql", "redis", "database", "postgres", "sql"]):
                categories_to_load.add("databases")
            elif any(k in s_low for k in ["tensorflow", "opencv", "ai", "ml", "keras", "pytorch"]):
                categories_to_load.add("ml_ai")
            else:
                # Add a custom dynamic category for this custom skill
                categories_to_load.add(f"custom_{s}")

        projects_to_recommend = []
        for cat in categories_to_load:
            if cat in PROJECT_CATALOG:
                projects_to_recommend.extend(PROJECT_CATALOG[cat])
            elif cat.startswith("custom_"):
                skill_name = cat.replace("custom_", "")
                projects_to_recommend.extend(generate_dynamic_projects(skill_name))

        # Guarantee at least 3 projects
        if len(projects_to_recommend) < 3:
            # Add backend catalog default
            projects_to_recommend.extend(PROJECT_CATALOG["backend"])

        # Save to database
        db_rec = await crud.create_project_recommendation(
            user_id=str(current_user["_id"]),
            resume_name=payload.resume_name,
            job_title=payload.job_title,
            projects=projects_to_recommend
        )
        return serialize_doc(db_rec)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate project recommendations: {str(e)}")

@app.get("/api/project_recommendations", response_model=List[ProjectRecommendationResponse])
async def get_project_recommendations(current_user: dict = Depends(get_current_user)):
    """
    Retrieves previous project recommendation logs generated by the active logged-in user.
    """
    recs = await crud.get_project_recommendations_by_user(str(current_user["_id"]))
    return [serialize_doc(r) for r in recs]

# --- Legacy AI Mock Interview Endpoints (Deprecated) ---

# --- Secured AI Mock Interview Endpoints ---

MOCK_INTERVIEW_QUESTIONS = {
    "hr": [
        "Tell me about a technical challenge you recently overcame, and how you communicated it to non-technical stakeholders.",
        "Why are you looking to join our engineering team, and how does your career vision align with our roadmap?",
        "What is your preferred approach to collaborating on cross-functional software engineering teams?"
    ],
    "technical": [
        "How do container systems like Docker handle storage persistence, and what are volumes?",
        "Explain how asynchronous event loops optimize server throughput in FastAPI.",
        "What is the difference between SQL and NoSQL database indexing strategies, and when to use compound keys?"
    ],
    "behavioral": [
        "Describe a time you recognized a major technical bottleneck in production and took ownership to resolve it.",
        "Tell me about a project implementation that failed and what technical lessons you carried forward.",
        "Explain a situation where you had to work under intense delivery constraints and how you managed priorities."
    ],
    "coding": [
        "Write a function to verify if a string is a palindrome, ignoring non-alphanumeric characters.",
        "Explain how garbage collection works inside Python, and what circular references are.",
        "Write a function to return the first non-repeating character in a string. Explain the runtime complexity."
    ],
    "system_design": [
        "How would you design a highly-available service deployment across multiple cloud regions?",
        "Explain the Control Plane architecture in Kubernetes and how its reconciliation loop functions.",
        "Design a distributed rate-limiting mechanism using FastAPI, Redis caches, and rolling windows."
    ]
}

@app.post("/api/mock_interviews", response_model=MockInterviewResponse)
async def start_mock_interview(payload: MockInterviewCreate, current_user: dict = Depends(get_current_user)):
    """
    Starts a mock interview session and returns job-specific questions based on category, resume, and gaps.
    """
    try:
        from database import resumes_collection
        from interview_coach import QuestionGenerator
        
        active_resume = await resumes_collection.find_one({"user_id": str(current_user["_id"]), "is_active": True})
        resume_text = active_resume.get("text", "") if active_resume else ""
        
        generator = QuestionGenerator()
        questions = generator.generate_questions_list(
            resume_text=resume_text,
            target_role=payload.job_title,
            missing_skills=payload.missing_skills or [],
            difficulty=payload.difficulty_level,
            company=payload.company_name or "Generic Software Company",
            topic_focus=payload.topic_focus or "Mixed Interview",
            practice_mode=payload.practice_mode or "standard"
        )
        
        db_interview = await crud.create_mock_interview(
            user_id=str(current_user["_id"]),
            job_title=payload.job_title,
            interview_type=payload.interview_type,
            difficulty_level=payload.difficulty_level,
            duration=payload.duration,
            questions=questions,
            company_name=payload.company_name,
            topic_focus=payload.topic_focus,
            practice_mode=payload.practice_mode,
            enable_adaptive=payload.enable_adaptive
        )
        return serialize_doc(db_interview)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to start mock interview: {str(e)}")

# --- Required Endpoints under /api/interview prefix ---

@app.post("/api/interview/start", response_model=MockInterviewResponse)
async def start_interview_upgraded(payload: MockInterviewCreate, current_user: dict = Depends(get_current_user)):
    """
    Required POST /api/interview/start endpoint.
    """
    return await start_mock_interview(payload, current_user)

@app.post("/api/interview/question")
async def get_interview_question(payload: QuestionRequest, current_user: dict = Depends(get_current_user)):
    """
    Required POST /api/interview/question endpoint.
    """
    try:
        from bson import ObjectId
        from database import mock_interviews_collection
        existing = await mock_interviews_collection.find_one({"_id": ObjectId(payload.session_id), "user_id": str(current_user["_id"])})
        if not existing:
            raise HTTPException(status_code=404, detail="Interview session not found.")
        q_list = existing.get("questions", [])
        if payload.question_idx < 0 or payload.question_idx >= len(q_list):
            raise HTTPException(status_code=404, detail="Question index out of bounds.")
        return {"question": q_list[payload.question_idx]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get question: {str(e)}")

@app.post("/api/interview/answer", response_model=MockInterviewResponse)
async def submit_raw_answer(payload: AnswerSubmissionUpgraded, current_user: dict = Depends(get_current_user)):
    """
    Required POST /api/interview/answer endpoint. Saves answer in MongoDB.
    """
    try:
        from bson import ObjectId
        from database import mock_interviews_collection
        existing = await mock_interviews_collection.find_one({"_id": ObjectId(payload.session_id), "user_id": str(current_user["_id"])})
        if not existing:
            raise HTTPException(status_code=404, detail="Interview session not found.")
        answers = existing.get("answers", [])
        while len(answers) <= payload.question_idx:
            answers.append("")
        answers[payload.question_idx] = payload.answer
        updated = await mock_interviews_collection.find_one_and_update(
            {"_id": ObjectId(payload.session_id), "user_id": str(current_user["_id"])},
            {"$set": {"answers": answers}},
            return_document=True
        )
        return serialize_doc(updated)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit raw answer: {str(e)}")

@app.post("/api/interview/analyze", response_model=QuestionEvaluation)
async def analyze_interview_answer(payload: AnalyzeRequest, current_user: dict = Depends(get_current_user)):
    """
    Required POST /api/interview/analyze endpoint. Runs EvaluationEngine and logs it in MongoDB.
    """
    try:
        from interview_coach import EvaluationEngine
        evaluation = EvaluationEngine.evaluate_answer(
            question=payload.question,
            answer=payload.answer,
            response_time=payload.response_time or 30.0
        )
        
        # Check and handle adaptive logic
        from database import mock_interviews_collection
        from bson import ObjectId
        session_id = payload.session_id
        session = await mock_interviews_collection.find_one({"_id": ObjectId(session_id)})
        
        if session and session.get("enable_adaptive"):
            from interview_coach import DifficultyEngine, QuestionGenerator
            current_diff = session.get("difficulty_level", "Medium")
            score = evaluation["score"]
            new_diff = DifficultyEngine.adjust_difficulty(current_diff, score)
            
            if new_diff != current_diff:
                await mock_interviews_collection.update_one(
                    {"_id": ObjectId(session_id)},
                    {"$set": {"difficulty_level": new_diff}}
                )
                
                from database import resumes_collection
                active_resume = await resumes_collection.find_one({"user_id": str(current_user["_id"]), "is_active": True})
                resume_text = active_resume.get("text", "") if active_resume else ""
                
                generator = QuestionGenerator(previously_asked=session.get("questions")[:payload.question_idx + 1])
                new_qs = generator.generate_questions_list(
                    resume_text=resume_text,
                    target_role=session.get("job_title"),
                    missing_skills=session.get("missing_skills", []),
                    difficulty=new_diff,
                    company=session.get("company_name") or "Generic Software Company",
                    topic_focus=session.get("topic_focus") or "Mixed Interview",
                    practice_mode=session.get("practice_mode") or "standard"
                )
                
                q_list = session.get("questions", [])
                for i in range(payload.question_idx + 1, len(q_list)):
                    new_q_idx = i - (payload.question_idx + 1)
                    if new_q_idx < len(new_qs):
                        q_list[i] = new_qs[new_q_idx]
                        
                await mock_interviews_collection.update_one(
                    {"_id": ObjectId(session_id)},
                    {"$set": {"questions": q_list}}
                )
        
        await crud.update_mock_interview_evaluations(
            user_id=str(current_user["_id"]),
            interview_id=payload.session_id,
            question_idx=payload.question_idx,
            answer=payload.answer,
            evaluation=evaluation
        )
        return evaluation
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")

@app.post("/api/interview/end", response_model=MockInterviewResponse)
async def end_interview_session_upgraded(payload: EndInterviewRequest, current_user: dict = Depends(get_current_user)):
    """
    Required POST /api/interview/end endpoint. Compiles performance score reports.
    """
    return await finalize_interview_session(payload.session_id, current_user, payload.presentation_analysis)

@app.get("/api/interview/history", response_model=List[MockInterviewResponse])
async def get_interview_history_upgraded(current_user: dict = Depends(get_current_user)):
    """
    Required GET /api/interview/history endpoint.
    """
    return await get_mock_interviews(current_user)

@app.delete("/api/interview/{id}")
async def delete_interview_history_session(id: str, current_user: dict = Depends(get_current_user)):
    """
    Required DELETE /api/interview/{id} endpoint.
    """
    return await delete_mock_interview(id, current_user)

@app.get("/api/interview/{id}/report")
async def download_interview_report_path(id: str, current_user: dict = Depends(get_current_user)):
    """
    Required GET /api/interview/{id}/report endpoint. Downloads report PDF.
    """
    return await download_interview_report(id, current_user)

@app.post("/api/mock_interviews/{id}/evaluate", response_model=QuestionEvaluation)
async def evaluate_interview_answer(id: str, payload: AnswerSubmission, current_user: dict = Depends(get_current_user)):
    """
    Alias /api/mock_interviews/{id}/evaluate evaluation gateway.
    """
    req = AnalyzeRequest(
        session_id=id,
        question_idx=payload.question_idx,
        question=payload.question,
        answer=payload.answer,
        response_time=payload.response_time
    )
    return await analyze_interview_answer(req, current_user)

@app.post("/api/mock_interviews/{id}/finalize", response_model=MockInterviewResponse)
async def finalize_interview_session(id: str, current_user: dict = Depends(get_current_user), presentation_analysis: Optional[dict] = None):
    """
    Finalizes the interview, aggregates overall scores and performance indicators, and saves logs.
    """
    try:
        from bson import ObjectId
        from database import mock_interviews_collection
        
        existing = await mock_interviews_collection.find_one({"_id": ObjectId(id), "user_id": str(current_user["_id"])})
        if not existing:
            raise HTTPException(status_code=404, detail="Interview session not found or unauthorized.")
            
        evals = existing.get("evaluations", [])
        valid_evals = [e for e in evals if e is not None]
        
        overall_score = 0.0
        tech_score = 0.0
        comm_score = 0.0
        sem_score = 0.0
        total_time = 0.0
        total_len = 0
        total_fillers = 0
        
        strongest = "N/A"
        weakest = "N/A"
        
        if valid_evals:
            overall_score = round(sum(e["score"] for e in valid_evals) / len(valid_evals), 1)
            tech_score = round(sum((e["technical_relevance"] + e["keyword_coverage"])/2 for e in valid_evals) / len(valid_evals), 1)
            comm_score = round(sum((e["communication_clarity"] + e["grammar_quality"])/2 for e in valid_evals) / len(valid_evals), 1)
            sem_score = round(sum(e["semantic_similarity"] for e in valid_evals) / len(valid_evals), 1)
            
            total_len = sum(e["answer_length"] for e in valid_evals)
            total_fillers = sum(e["filler_words"] for e in valid_evals)
            
            # Find strongest and weakest
            sorted_evals = sorted(enumerate(valid_evals), key=lambda x: x[1]["score"])
            weakest_idx = sorted_evals[0][0]
            strongest_idx = sorted_evals[-1][0]
            
            strongest = existing.get("questions")[strongest_idx]
            weakest = existing.get("questions")[weakest_idx]

        avg_len = round(total_len / max(1, len(valid_evals)), 1)
        avg_time = 24.5
        
        report_summary = (
            f"Successfully completed the {existing.get('interview_type')} mock interview. "
            f"Demonstrated solid performance in communication clarity ({comm_score}%), with an overall score "
            f"of {overall_score}%. Review suggestions to improve on technical relevance ({tech_score}%)."
        )
        
        # Deduce weak topics (score < 75%) to generate learning recommendations
        weak_topics = []
        for idx, e in enumerate(valid_evals):
            if e.get("score", 100) < 75:
                q_text = existing.get("questions")[idx].lower() if existing.get("questions") else ""
                if any(x in q_text for x in ["python", "list", "tuple", "garbage collection"]):
                    weak_topics.append("python")
                elif any(x in q_text for x in ["react", "virtual dom", "hook", "rendering"]):
                    weak_topics.append("react")
                elif any(x in q_text for x in ["fastapi", "lifespan", "asgi"]):
                    weak_topics.append("fastapi")
                elif any(x in q_text for x in ["system design", "docker", "container", "acid", "overfitting"]):
                    weak_topics.append("system_design")
        
        weak_topics = list(set(weak_topics))
        from interview_coach import RecommendationEngine
        learning_recs = RecommendationEngine.get_recommendations(weak_topics)
        
        updated = await crud.finalize_mock_interview(
            user_id=str(current_user["_id"]),
            interview_id=id,
            overall_score=overall_score,
            technical_score=tech_score,
            communication_score=comm_score,
            semantic_match_score=sem_score,
            avg_response_time=avg_time,
            avg_answer_length=avg_len,
            filler_word_count=total_fillers,
            strongest_answer=strongest,
            weakest_answer=weakest,
            report_summary=report_summary,
            presentation_analysis=presentation_analysis,
            learning_recommendations=learning_recs
        )
        return serialize_doc(updated)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to finalize mock interview: {str(e)}")

@app.get("/api/mock_interviews", response_model=List[MockInterviewResponse])
async def get_mock_interviews(current_user: dict = Depends(get_current_user)):
    """
    Retrieves previous mock interview sessions logged by the active candidate.
    """
    interviews = await crud.get_mock_interviews_by_user(str(current_user["_id"]))
    return [serialize_doc(i) for i in interviews]

@app.delete("/api/mock_interviews/{id}")
async def delete_mock_interview(id: str, current_user: dict = Depends(get_current_user)):
    """
    Deletes the target interview session from history under user-isolation constraints.
    """
    success = await crud.delete_mock_interview_session(str(current_user["_id"]), id)
    if not success:
        raise HTTPException(status_code=404, detail="Interview session not found or unauthorized.")
    return {"status": "success", "detail": "Interview session deleted successfully."}

from fastapi.responses import StreamingResponse
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

@app.get("/api/mock_interviews/{id}/report")
async def download_interview_report(id: str, current_user: dict = Depends(get_current_user)):
    """
    Generates a professional PDF interview report containing candidate info, questions, transcript, scores, and feedback.
    """
    try:
        from bson import ObjectId
        from database import mock_interviews_collection
        
        session = await mock_interviews_collection.find_one({"_id": ObjectId(id), "user_id": str(current_user["_id"])})
        if not session:
            raise HTTPException(status_code=404, detail="Interview session not found or unauthorized.")
            
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        story = []
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=15
        )
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=12,
            textColor=colors.HexColor('#475569'),
            spaceAfter=25
        )
        h2_style = ParagraphStyle(
            'H2Style',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=15,
            spaceAfter=10
        )
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#334155'),
            spaceAfter=8
        )
        
        story.append(Paragraph("AI Mock Interview Evaluation Report", title_style))
        story.append(Paragraph(f"Candidate: {current_user.get('name', 'User')} | Date: {session.get('created_date').strftime('%Y-%m-%d %H:%M')}", subtitle_style))
        
        data = [
            [Paragraph("<b>Target Job Role</b>", body_style), Paragraph(str(session.get("job_title")), body_style)],
            [Paragraph("<b>Interview Type</b>", body_style), Paragraph(str(session.get("interview_type")), body_style)],
            [Paragraph("<b>Difficulty Level</b>", body_style), Paragraph(str(session.get("difficulty_level")), body_style)],
            [Paragraph("<b>Overall Score</b>", body_style), Paragraph(f"<b>{session.get('overall_score')}%</b>", body_style)],
            [Paragraph("<b>Technical Score</b>", body_style), Paragraph(f"{session.get('technical_score')}%", body_style)],
            [Paragraph("<b>Communication Score</b>", body_style), Paragraph(f"{session.get('communication_score')}%", body_style)],
            [Paragraph("<b>Semantic Match</b>", body_style), Paragraph(f"{session.get('semantic_match_score')}%", body_style)],
        ]
        t = Table(data, colWidths=[150, 350])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('TOPPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 15))
        
        story.append(Paragraph("<b>Performance Overview</b>", h2_style))
        story.append(Paragraph(str(session.get("report_summary") or "Interview completed successfully."), body_style))
        story.append(Spacer(1, 15))
        
        p_analysis = session.get("presentation_analysis")
        if p_analysis:
            story.append(Paragraph("<b>Presentation & Attire Estimates Report</b>", h2_style))
            story.append(Paragraph("This section outlines presentation metrics estimated client-side using real-time computer vision during the interview session.", body_style))
            
            p_score = p_analysis.get("overall_presentation_score")
            p_score_str = f"{p_score}%" if isinstance(p_score, (int, float)) else "Unavailable"
            
            p_data = [
                [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Score / Estimate</b>", body_style)],
                [Paragraph("Face Visibility", body_style), Paragraph(f"{p_analysis.get('face_visibility')}%" if isinstance(p_analysis.get('face_visibility'), (int, float)) else str(p_analysis.get('face_visibility') or "Unavailable"), body_style)],
                [Paragraph("Face Positioning", body_style), Paragraph(f"{p_analysis.get('face_positioning')}%" if isinstance(p_analysis.get('face_positioning'), (int, float)) else str(p_analysis.get('face_positioning') or "Unavailable"), body_style)],
                [Paragraph("Eye Contact Estimate", body_style), Paragraph(f"{p_analysis.get('eye_contact')}%" if isinstance(p_analysis.get('eye_contact'), (int, float)) else str(p_analysis.get('eye_contact') or "Unavailable"), body_style)],
                [Paragraph("Head Posture Estimate", body_style), Paragraph(f"{p_analysis.get('head_posture')}%" if isinstance(p_analysis.get('head_posture'), (int, float)) else str(p_analysis.get('head_posture') or "Unavailable"), body_style)],
                [Paragraph("Lighting Quality", body_style), Paragraph(f"{p_analysis.get('lighting_quality')}%" if isinstance(p_analysis.get('lighting_quality'), (int, float)) else str(p_analysis.get('lighting_quality') or "Unavailable"), body_style)],
                [Paragraph("Camera Framing", body_style), Paragraph(f"{p_analysis.get('camera_framing')}%" if isinstance(p_analysis.get('camera_framing'), (int, float)) else str(p_analysis.get('camera_framing') or "Unavailable"), body_style)],
                [Paragraph("Background Cleanliness", body_style), Paragraph(f"{p_analysis.get('background_cleanliness')}%" if isinstance(p_analysis.get('background_cleanliness'), (int, float)) else str(p_analysis.get('background_cleanliness') or "Unavailable"), body_style)],
                [Paragraph("Business Attire Estimate", body_style), Paragraph(f"{p_analysis.get('business_attire')} (Score: {p_analysis.get('business_attire_score')}%)" if isinstance(p_analysis.get('business_attire_score'), (int, float)) else str(p_analysis.get('business_attire') or "Unavailable"), body_style)],
                [Paragraph("Observed Expression", body_style), Paragraph(f"{p_analysis.get('facial_engagement')} (Confidence: {p_analysis.get('facial_engagement_score')}%)" if (p_analysis.get('facial_engagement_score') or 0) > 0 else str(p_analysis.get('facial_engagement') or "Unavailable"), body_style)],
                [Paragraph("<b>Overall Presentation Score</b>", body_style), Paragraph(f"<b>{p_score_str}</b>", body_style)]
            ]
            pt = Table(p_data, colWidths=[200, 300])
            pt.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#EDF2F7')),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('TOPPADDING', (0,0), (-1,-1), 4),
            ]))
            story.append(pt)
            story.append(Spacer(1, 15))
            
        story.append(Paragraph("<b>Question-by-Question Evaluation Breakdown</b>", h2_style))
        
        questions = session.get("questions", [])
        answers = session.get("answers", [])
        evals = session.get("evaluations", [])
        
        for idx, q in enumerate(questions):
            story.append(Paragraph(f"<b>Question {idx+1}: {q}</b>", h2_style))
            
            user_ans = answers[idx] if idx < len(answers) else ""
            story.append(Paragraph(f"<i>Your Answer:</i> {user_ans}", body_style))
            
            if idx < len(evals) and evals[idx] is not None:
                ev = evals[idx]
                story.append(Paragraph(f"<b>Answer Score: {ev.get('score')}%</b>", body_style))
                story.append(Paragraph(f"• Technical Relevance: {ev.get('technical_relevance')}% | Completeness: {ev.get('completeness')}%", body_style))
                story.append(Paragraph(f"• Clarity: {ev.get('communication_clarity')}% | Speaking Pace: {ev.get('speaking_pace')} WPM | Filler Words: {ev.get('filler_words')}", body_style))
                story.append(Paragraph(f"• Grammar Quality: {ev.get('grammar_quality')}% | Semantic Similarity: {ev.get('semantic_similarity')}%", body_style))
                
                story.append(Paragraph("<i>AI Feedback:</i>", body_style))
                for strg in ev.get("strengths", []):
                    story.append(Paragraph(f"- Strength: {strg}", body_style))
                
                story.append(Paragraph(f"<i>Suggested Better Answer:</i> {ev.get('model_answer')}", body_style))
                story.append(Paragraph(f"<i>Improvement Tips:</i> {ev.get('suggested_improvement')}", body_style))
            else:
                story.append(Paragraph("No evaluation generated for this question.", body_style))
            
            story.append(Spacer(1, 10))
            
        doc.build(story)
        buffer.seek(0)
        
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=interview_report_{id}.pdf"}
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF report: {str(e)}")

@app.get("/api/health")
def read_health():
    return {"status": "healthy", "service": "Resume Skill Gap Analyzer API"}

@app.get("/")
def read_root():
    return {"status": "healthy", "service": "Resume Skill Gap Analyzer API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
