import asyncio
from app import analyze, AnalysisCreate
from database import users_collection, analyses_collection
from auth import hash_password

async def test_api_handler():
    email = "test_handler_user@resumeintel.io"
    
    # 1. Clear test user analyses
    await analyses_collection.delete_many({"user_id": "test_mock_id_123"})
    await users_collection.delete_many({"email": email})
    
    # 2. Get/create mock user
    user = {
        "_id": "test_mock_id_123",
        "name": "API Tester",
        "email": email,
        "password_hash": hash_password("testpassword123"),
        "profile_picture": "",
        "phone_number": "",
        "linkedin_url": "",
        "github_url": "",
        "preferred_job_role": "",
        "experience_level": "",
        "created_date": None
    }
    
    # 3. Create mock payload
    payload = AnalysisCreate(
        resume_text="Experienced Python Developer with FastAPI and MongoDB.",
        job_desc_text="Role: Backend Developer\nRequirements: Python, FastAPI, MongoDB.",
        weights=None
    )
    
    print("Calling analyze endpoint handler directly...")
    try:
        response = await analyze(payload, current_user=user)
        print("Success! Handler returned response:")
        print(response)
    except Exception as e:
        print("Failure! Exception raised during handler execution:")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_api_handler())
