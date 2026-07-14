from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    profile_picture: Optional[str] = ""
    phone_number: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    github_url: Optional[str] = ""
    preferred_job_role: Optional[str] = ""
    experience_level: Optional[str] = ""
    education: Optional[str] = ""
    skills: Optional[str] = ""
    certifications: Optional[str] = ""
    created_date: datetime

class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_picture: Optional[str] = None
    phone_number: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    preferred_job_role: Optional[str] = None
    experience_level: Optional[str] = None
    education: Optional[str] = None
    skills: Optional[str] = None
    certifications: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ResumeResponse(BaseModel):
    id: str
    filename: str
    filepath: Optional[str] = ""
    text: str
    word_count: int
    target_role: Optional[str] = "Not set"
    ats_score: Optional[float] = 0.0
    version: Optional[str] = "v1"
    is_active: Optional[bool] = False
    created_date: datetime

class AnalysisCreate(BaseModel):
    resume_text: Optional[str] = None
    resume_id: Optional[str] = None
    job_desc_text: str
    weights: Optional[Dict[str, float]] = None

class AnalysisResponse(BaseModel):
    id: str
    resume_filename: str
    job_title: str
    ats_score: float
    semantic_score: float
    keyword_score: float
    skills_match_score: float
    formatting_score: float
    experience_score: float
    results: Dict[str, Any]
    created_date: datetime

class ReportResponse(BaseModel):
    id: str
    filename: str
    resume_name: Optional[str] = "Unnamed_Resume.txt"
    job_title: str
    ats_score: float
    download_count: Optional[int] = 0
    last_downloaded: Optional[datetime] = None
    created_date: datetime

class InterviewCreate(BaseModel):
    query: str
    response: str

class InterviewResponse(BaseModel):
    id: str
    query: str
    response: str
    created_date: datetime

class RewriteCreate(BaseModel):
    resume_name: str
    resume_text: str
    job_desc_text: str
    analysis_results: Dict[str, Any]

class RewriteResponse(BaseModel):
    id: str
    resume_name: str
    sections: List[Dict[str, Any]]
    created_date: datetime

class InterviewPrepCreate(BaseModel):
    resume_name: str
    job_title: str
    missing_skills: List[str]

class InterviewPrepResponse(BaseModel):
    id: str
    resume_name: str
    job_title: str
    difficulty_level: str
    estimated_prep_time: str
    technical_questions: List[Dict[str, Any]]
    hr_questions: List[Dict[str, Any]]
    behavioral_questions: List[Dict[str, Any]]
    coding_questions: List[Dict[str, Any]]
    top_tips: List[str]
    recommended_topics: List[str]
    created_date: datetime

class ProjectRecommendationCreate(BaseModel):
    resume_name: str
    job_title: str
    missing_skills: List[str]

class ProjectRecommendationResponse(BaseModel):
    id: str
    resume_name: str
    job_title: str
    projects: List[Dict[str, Any]]
    created_date: datetime

class MockInterviewCreate(BaseModel):
    job_title: str
    interview_type: str = "Technical"
    difficulty_level: str = "Medium"
    duration: int = 15
    missing_skills: Optional[List[str]] = None
    company_name: Optional[str] = "Generic Software Company"
    topic_focus: Optional[str] = "Mixed Interview"
    practice_mode: Optional[str] = "standard"
    enable_adaptive: Optional[bool] = False

class AnswerSubmission(BaseModel):
    question_idx: int
    question: str
    answer: str
    response_time: Optional[float] = 0.0

class QuestionEvaluation(BaseModel):
    technical_relevance: float
    completeness: float
    communication_clarity: float
    keyword_coverage: float
    speaking_pace: float
    filler_words: int
    answer_length: int
    grammar_quality: float
    semantic_similarity: float
    pronunciation_clarity: Optional[float] = 90.0
    vocabulary_richness: Optional[float] = 85.0
    score: float
    strengths: List[str]
    weaknesses: List[str]
    model_answer: str
    suggested_improvement: str

class MockInterviewResponse(BaseModel):
    id: str
    job_title: str
    interview_type: Optional[str] = "Technical"
    difficulty_level: Optional[str] = "Medium"
    duration: Optional[int] = 15
    questions: List[str]
    answers: List[str]
    evaluations: List[Optional[Dict[str, Any]]]
    overall_score: Optional[float] = 0.0
    technical_score: Optional[float] = 0.0
    communication_score: Optional[float] = 0.0
    semantic_match_score: Optional[float] = 0.0
    avg_response_time: Optional[float] = 0.0
    avg_answer_length: Optional[float] = 0.0
    filler_word_count: Optional[int] = 0
    strongest_answer: Optional[str] = None
    weakest_answer: Optional[str] = None
    report_summary: Optional[str] = None
    presentation_analysis: Optional[Dict[str, Any]] = None
    learning_recommendations: Optional[List[Dict[str, Any]]] = None
    created_date: datetime

class QuestionRequest(BaseModel):
    session_id: str
    question_idx: int

class AnswerSubmissionUpgraded(BaseModel):
    session_id: str
    question_idx: int
    answer: str

class AnalyzeRequest(BaseModel):
    session_id: str
    question_idx: int
    question: str
    answer: str
    response_time: Optional[float] = 0.0

class EndInterviewRequest(BaseModel):
    session_id: str
    presentation_analysis: Optional[Dict[str, Any]] = None
