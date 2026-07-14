import os
import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")

client = AsyncIOMotorClient(MONGODB_URL, tlsCAFile=certifi.where())
db = client["resume_analyzer"]

# Collections
users_collection = db["users"]
resumes_collection = db["resumes"]
analyses_collection = db["analyses"]
reports_collection = db["reports"]
interview_sessions_collection = db["interview_sessions"]
rewrites_collection = db["rewrites"]
interview_preps_collection = db["interview_preps"]
project_recommendations_collection = db["project_recommendations"]
mock_interviews_collection = db["mock_interviews"]