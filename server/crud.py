from datetime import datetime
from typing import Optional
from bson import ObjectId
from database import (
    users_collection,
    resumes_collection,
    analyses_collection,
    reports_collection,
    interview_sessions_collection,
    rewrites_collection,
    interview_preps_collection,
    project_recommendations_collection,
    mock_interviews_collection
)

# --- User CRUD ---

async def create_user(name: str, email: str, password_hash: str) -> dict:
    new_user = {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "profile_picture": "",
        "phone_number": "",
        "linkedin_url": "",
        "github_url": "",
        "preferred_job_role": "",
        "experience_level": "",
        "education": "",
        "skills": "",
        "certifications": "",
        "created_date": datetime.utcnow()
    }
    result = await users_collection.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    return new_user

async def get_user_by_email(email: str) -> dict:
    return await users_collection.find_one({"email": email})

async def get_user_by_id(user_id: str) -> dict:
    try:
        return await users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None

async def update_user_profile(user_id: str, updates: dict) -> dict:
    try:
        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": updates}
        )
        return await users_collection.find_one({"_id": ObjectId(user_id)})
    except Exception:
        return None

# --- Resume CRUD (User Isolated) ---

async def create_resume(
    user_id: str,
    filename: str,
    filepath: str,
    text: str,
    word_count: int,
    target_role: str = "Not set",
    version: str = "v1",
    is_active: bool = False
) -> dict:
    new_resume = {
        "user_id": user_id,
        "filename": filename,
        "filepath": filepath,
        "text": text,
        "word_count": word_count,
        "target_role": target_role,
        "ats_score": 0.0,
        "version": version,
        "is_active": is_active,
        "created_date": datetime.utcnow()
    }
    
    # If is_active is True, unset others first
    if is_active:
        await resumes_collection.update_many(
            {"user_id": user_id},
            {"$set": {"is_active": False}}
        )
        
    result = await resumes_collection.insert_one(new_resume)
    new_resume["_id"] = result.inserted_id
    return new_resume

async def get_resumes_by_user(user_id: str) -> list:
    resumes = []
    cursor = resumes_collection.find({"user_id": user_id})
    async for document in cursor:
        resumes.append(document)
    return resumes

async def get_resume_by_id(user_id: str, resume_id: str) -> dict:
    try:
        return await resumes_collection.find_one({
            "_id": ObjectId(resume_id),
            "user_id": user_id
        })
    except Exception:
        return None

async def rename_resume(user_id: str, resume_id: str, new_filename: str) -> dict:
    try:
        await resumes_collection.update_one(
            {"_id": ObjectId(resume_id), "user_id": user_id},
            {"$set": {"filename": new_filename}}
        )
        return await resumes_collection.find_one({"_id": ObjectId(resume_id)})
    except Exception:
        return None

async def delete_resume(user_id: str, resume_id: str) -> dict:
    """Deletes resume document and returns its details (to clean up file from disk)."""
    try:
        resume = await resumes_collection.find_one({
            "_id": ObjectId(resume_id),
            "user_id": user_id
        })
        if resume:
            await resumes_collection.delete_one({"_id": ObjectId(resume_id)})
        return resume
    except Exception:
        return None

async def set_active_resume(user_id: str, resume_id: str) -> dict:
    try:
        # Unset all
        await resumes_collection.update_many(
            {"user_id": user_id},
            {"$set": {"is_active": False}}
        )
        # Set active
        await resumes_collection.update_one(
            {"_id": ObjectId(resume_id), "user_id": user_id},
            {"$set": {"is_active": True}}
        )
        return await resumes_collection.find_one({"_id": ObjectId(resume_id)})
    except Exception:
        return None

async def update_resume_score(user_id: str, resume_id: str, score: float, target_role: str = None) -> dict:
    try:
        update_fields = {"ats_score": score}
        if target_role:
            update_fields["target_role"] = target_role
            
        await resumes_collection.update_one(
            {"_id": ObjectId(resume_id), "user_id": user_id},
            {"$set": update_fields}
        )
        return await resumes_collection.find_one({"_id": ObjectId(resume_id)})
    except Exception:
        return None

# --- Analysis CRUD (User Isolated) ---

async def create_analysis(
    user_id: str,
    resume_filename: str,
    job_title: str,
    ats_score: int,
    semantic_score: int,
    keyword_score: int,
    skills_match_score: int,
    formatting_score: int,
    experience_score: int,
    results: dict
) -> dict:
    new_analysis = {
        "user_id": user_id,
        "resume_filename": resume_filename,
        "job_title": job_title,
        "ats_score": ats_score,
        "semantic_score": semantic_score,
        "keyword_score": keyword_score,
        "skills_match_score": skills_match_score,
        "formatting_score": formatting_score,
        "experience_score": experience_score,
        "results": results,
        "created_date": datetime.utcnow()
    }
    try:
        import asyncio
        result = await asyncio.wait_for(analyses_collection.insert_one(new_analysis), timeout=2.0)
        new_analysis["_id"] = result.inserted_id
    except Exception as e:
        print(f"[CRUD WARNING] MongoDB insert_one analysis failed/timed out: {str(e)}")
        from bson import ObjectId
        new_analysis["_id"] = ObjectId()
    return new_analysis

async def get_analyses_by_user(user_id: str) -> list:
    analyses = []
    cursor = analyses_collection.find({"user_id": user_id})
    async for document in cursor:
        analyses.append(document)
    return analyses

async def delete_analysis_by_id(user_id: str, analysis_id: str) -> bool:
    try:
        result = await analyses_collection.delete_one({
            "_id": ObjectId(analysis_id),
            "user_id": user_id
        })
        return result.deleted_count > 0
    except Exception:
        return False

# --- Report CRUD (User Isolated) ---

async def create_report_log(
    user_id: str,
    filename: str,
    resume_name: str,
    job_title: str,
    ats_score: float
) -> dict:
    new_report = {
        "user_id": user_id,
        "filename": filename,
        "resume_name": resume_name,
        "job_title": job_title,
        "ats_score": ats_score,
        "download_count": 0,
        "last_downloaded": None,
        "created_date": datetime.utcnow()
    }
    result = await reports_collection.insert_one(new_report)
    new_report["_id"] = result.inserted_id
    return new_report

async def get_reports_by_user(user_id: str) -> list:
    reports = []
    cursor = reports_collection.find({"user_id": user_id})
    async for document in cursor:
        reports.append(document)
    return reports

async def delete_report_log(user_id: str, report_id: str) -> bool:
    try:
        result = await reports_collection.delete_one({
            "_id": ObjectId(report_id),
            "user_id": user_id
        })
        return result.deleted_count > 0
    except Exception:
        return False

async def increment_report_download(user_id: str, report_id: str) -> dict:
    try:
        await reports_collection.update_one(
            {"_id": ObjectId(report_id), "user_id": user_id},
            {
                "$inc": {"download_count": 1},
                "$set": {"last_downloaded": datetime.utcnow()}
            }
        )
        return await reports_collection.find_one({
            "_id": ObjectId(report_id),
            "user_id": user_id
        })
    except Exception:
        return None

# --- Interview Session CRUD (User Isolated) ---

async def create_interview_session(user_id: str, query: str, response: str) -> dict:
    new_session = {
        "user_id": user_id,
        "query": query,
        "response": response,
        "created_date": datetime.utcnow()
    }
    result = await interview_sessions_collection.insert_one(new_session)
    new_session["_id"] = result.inserted_id
    return new_session

async def get_interview_sessions_by_user(user_id: str) -> list:
    sessions = []
    cursor = interview_sessions_collection.find({"user_id": user_id})
    async for document in cursor:
        sessions.append(document)
    return sessions

# --- AI Rewrite CRUD (User Isolated) ---

async def create_rewrite_history(
    user_id: str,
    resume_name: str,
    sections: list
) -> dict:
    new_rewrite = {
        "user_id": user_id,
        "resume_name": resume_name,
        "sections": sections,
        "created_date": datetime.utcnow()
    }
    result = await rewrites_collection.insert_one(new_rewrite)
    new_rewrite["_id"] = result.inserted_id
    return new_rewrite

async def get_rewrites_by_user(user_id: str) -> list:
    rewrites = []
    cursor = rewrites_collection.find({"user_id": user_id})
    async for document in cursor:
        rewrites.append(document)
    return rewrites

# --- Interview Prep CRUD (User Isolated) ---

async def create_interview_prep(
    user_id: str,
    resume_name: str,
    job_title: str,
    difficulty_level: str,
    estimated_prep_time: str,
    technical_questions: list,
    hr_questions: list,
    behavioral_questions: list,
    coding_questions: list,
    top_tips: list,
    recommended_topics: list
) -> dict:
    new_prep = {
        "user_id": user_id,
        "resume_name": resume_name,
        "job_title": job_title,
        "difficulty_level": difficulty_level,
        "estimated_prep_time": estimated_prep_time,
        "technical_questions": technical_questions,
        "hr_questions": hr_questions,
        "behavioral_questions": behavioral_questions,
        "coding_questions": coding_questions,
        "top_tips": top_tips,
        "recommended_topics": recommended_topics,
        "created_date": datetime.utcnow()
    }
    result = await interview_preps_collection.insert_one(new_prep)
    new_prep["_id"] = result.inserted_id
    return new_prep

async def get_interview_preps_by_user(user_id: str) -> list:
    preps = []
    cursor = interview_preps_collection.find({"user_id": user_id})
    async for document in cursor:
        preps.append(document)
    return preps

# --- Project Recommendation CRUD (User Isolated) ---

async def create_project_recommendation(
    user_id: str,
    resume_name: str,
    job_title: str,
    projects: list
) -> dict:
    new_rec = {
        "user_id": user_id,
        "resume_name": resume_name,
        "job_title": job_title,
        "projects": projects,
        "created_date": datetime.utcnow()
    }
    result = await project_recommendations_collection.insert_one(new_rec)
    new_rec["_id"] = result.inserted_id
    return new_rec

async def get_project_recommendations_by_user(user_id: str) -> list:
    recs = []
    cursor = project_recommendations_collection.find({"user_id": user_id})
    async for document in cursor:
        recs.append(document)
    return recs

# --- AI Mock Interview CRUD (User Isolated) ---

async def create_mock_interview(
    user_id: str,
    job_title: str,
    interview_type: str,
    difficulty_level: str,
    duration: int,
    questions: list,
    company_name: str = "Generic Software Company",
    topic_focus: str = "Mixed Interview",
    practice_mode: str = "standard",
    enable_adaptive: bool = False
) -> dict:
    new_interview = {
        "user_id": user_id,
        "job_title": job_title,
        "interview_type": interview_type,
        "difficulty_level": difficulty_level,
        "duration": duration,
        "company_name": company_name,
        "topic_focus": topic_focus,
        "practice_mode": practice_mode,
        "enable_adaptive": enable_adaptive,
        "questions": questions,
        "answers": ["" for _ in questions],
        "evaluations": [None for _ in questions],
        "overall_score": 0.0,
        "technical_score": 0.0,
        "communication_score": 0.0,
        "semantic_match_score": 0.0,
        "avg_response_time": 0.0,
        "avg_answer_length": 0.0,
        "filler_word_count": 0,
        "strongest_answer": None,
        "weakest_answer": None,
        "report_summary": None,
        "presentation_analysis": None,
        "created_date": datetime.utcnow()
    }
    result = await mock_interviews_collection.insert_one(new_interview)
    new_interview["_id"] = result.inserted_id
    return new_interview

async def update_mock_interview_evaluations(
    user_id: str,
    interview_id: str,
    question_idx: int,
    answer: str,
    evaluation: dict
) -> dict:
    existing = await mock_interviews_collection.find_one({"_id": ObjectId(interview_id), "user_id": user_id})
    if not existing:
        return None
        
    answers = existing.get("answers", [])
    evals = existing.get("evaluations", [])
    
    while len(answers) <= question_idx:
        answers.append("")
    while len(evals) <= question_idx:
        evals.append(None)
        
    answers[question_idx] = answer
    evals[question_idx] = evaluation
    
    updated = await mock_interviews_collection.find_one_and_update(
        {"_id": ObjectId(interview_id), "user_id": user_id},
        {"$set": {"answers": answers, "evaluations": evals}},
        return_document=True
    )
    return updated

async def finalize_mock_interview(
    user_id: str,
    interview_id: str,
    overall_score: float,
    technical_score: float,
    communication_score: float,
    semantic_match_score: float,
    avg_response_time: float,
    avg_answer_length: float,
    filler_word_count: int,
    strongest_answer: str,
    weakest_answer: str,
    report_summary: str,
    presentation_analysis: Optional[dict] = None,
    learning_recommendations: Optional[list] = None
) -> dict:
    updated = await mock_interviews_collection.find_one_and_update(
        {"_id": ObjectId(interview_id), "user_id": user_id},
        {"$set": {
            "overall_score": overall_score,
            "technical_score": technical_score,
            "communication_score": communication_score,
            "semantic_match_score": semantic_match_score,
            "avg_response_time": avg_response_time,
            "avg_answer_length": avg_answer_length,
            "filler_word_count": filler_word_count,
            "strongest_answer": strongest_answer,
            "weakest_answer": weakest_answer,
            "report_summary": report_summary,
            "presentation_analysis": presentation_analysis,
            "learning_recommendations": learning_recommendations
        }},
        return_document=True
    )
    return updated

async def get_mock_interviews_by_user(user_id: str) -> list:
    interviews = []
    cursor = mock_interviews_collection.find({"user_id": user_id})
    async for document in cursor:
        interviews.append(document)
    return interviews

async def delete_mock_interview_session(user_id: str, interview_id: str) -> bool:
    result = await mock_interviews_collection.delete_one({"_id": ObjectId(interview_id), "user_id": user_id})
    return result.deleted_count > 0
