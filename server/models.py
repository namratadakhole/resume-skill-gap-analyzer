from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserModel(BaseModel):
    name: str
    email: str
    password_hash: str
    profile_picture: Optional[str] = ""
    phone_number: Optional[str] = ""
    linkedin_url: Optional[str] = ""
    github_url: Optional[str] = ""
    preferred_job_role: Optional[str] = ""
    experience_level: Optional[str] = ""
    education: Optional[str] = ""
    skills: Optional[str] = ""
    certifications: Optional[str] = ""
    created_date: datetime = Field(default_factory=datetime.utcnow)

class ResumeModel(BaseModel):
    user_id: str
    filename: str
    filepath: Optional[str] = ""
    text: str
    word_count: int
    target_role: Optional[str] = "Not set"
    ats_score: Optional[float] = 0.0
    version: Optional[str] = "v1"
    is_active: Optional[bool] = False
    created_date: datetime = Field(default_factory=datetime.utcnow)

class AnalysisModel(BaseModel):
    user_id: str
    resume_filename: str
    job_title: str
    ats_score: float
    semantic_score: float
    keyword_score: float
    skills_match_score: float
    formatting_score: float
    experience_score: float
    results: Dict[str, Any]
    created_date: datetime = Field(default_factory=datetime.utcnow)

class ReportModel(BaseModel):
    user_id: str
    filename: str
    resume_name: Optional[str] = "Unnamed_Resume.txt"
    job_title: str
    ats_score: float
    download_count: Optional[int] = 0
    last_downloaded: Optional[datetime] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)

class InterviewSessionModel(BaseModel):
    user_id: str
    query: str
    response: str
    created_date: datetime = Field(default_factory=datetime.utcnow)

class RewriteModel(BaseModel):
    user_id: str
    resume_name: str
    sections: List[Dict[str, Any]]
    created_date: datetime = Field(default_factory=datetime.utcnow)

class InterviewPrepModel(BaseModel):
    user_id: str
    resume_name: str
    job_title: str
    difficulty_level: str = "Medium"
    estimated_prep_time: str = "4 hours"
    technical_questions: List[Dict[str, Any]]
    hr_questions: List[Dict[str, Any]]
    behavioral_questions: List[Dict[str, Any]]
    coding_questions: List[Dict[str, Any]]
    top_tips: List[str]
    recommended_topics: List[str]
    created_date: datetime = Field(default_factory=datetime.utcnow)

class ProjectRecommendationModel(BaseModel):
    user_id: str
    resume_name: str
    job_title: str
    projects: List[Dict[str, Any]]
    created_date: datetime = Field(default_factory=datetime.utcnow)

class MockInterviewModel(BaseModel):
    user_id: str
    job_title: str
    interview_type: str = "Technical"
    difficulty_level: str = "Medium"
    duration: int = 15
    company_name: Optional[str] = "Generic Software Company"
    topic_focus: Optional[str] = "Mixed Interview"
    practice_mode: Optional[str] = "standard"
    enable_adaptive: Optional[bool] = False
    questions: List[str]
    answers: List[str]
    evaluations: List[Optional[Dict[str, Any]]]
    overall_score: float = 0.0
    technical_score: float = 0.0
    communication_score: float = 0.0
    semantic_match_score: float = 0.0
    avg_response_time: float = 0.0
    avg_answer_length: float = 0.0
    filler_word_count: int = 0
    strongest_answer: Optional[str] = None
    weakest_answer: Optional[str] = None
    report_summary: Optional[str] = None
    presentation_analysis: Optional[Dict[str, Any]] = None
    learning_recommendations: Optional[List[Dict[str, Any]]] = None
    created_date: datetime = Field(default_factory=datetime.utcnow)
