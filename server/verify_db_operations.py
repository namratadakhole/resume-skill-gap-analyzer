import asyncio
import os
from database import users_collection, resumes_collection, analyses_collection
from schemas import UserRegister, UserLogin, UserUpdate
import crud
from auth import hash_password, verify_password, create_access_token

async def test_db():
    print("--- Starting MongoDB CRUD Operations Verification ---")
    
    # 1. Clean test records
    test_email = "tester@resumeintel.io"
    await users_collection.delete_many({"email": test_email})
    print("[OK] Cleared previous test user records.")

    # 2. Register User
    name = "DB Tester"
    password = "securepassword123"
    hashed = hash_password(password)
    
    db_user = await crud.create_user(name, test_email, hashed)
    assert db_user is not None, "Failed to create user"
    assert db_user["email"] == test_email, "User email mismatch"
    assert verify_password(password, db_user["password_hash"]), "Password hashing verification failed"
    print(f"[OK] Registered test user: {db_user['name']} (ID: {db_user['_id']})")

    # 3. Retrieve User
    fetched_user = await crud.get_user_by_email(test_email)
    assert fetched_user is not None, "Failed to fetch user by email"
    assert fetched_user["name"] == name, "User name mismatch on fetch"
    print(f"[OK] Fetched user by email: {fetched_user['email']}")

    # 4. Update Profile
    updates = {"preferred_job_role": "AI Specialist", "experience_level": "Senior Level"}
    updated_user = await crud.update_user_profile(str(db_user["_id"]), updates)
    assert updated_user is not None, "Profile update failed"
    assert updated_user["preferred_job_role"] == "AI Specialist", "Profile update fields mismatch"
    print(f"[OK] Updated user profile metadata. Preferred Job: {updated_user['preferred_job_role']}")

    # 5. Create Resume (Linked & Isolated)
    user_id = str(db_user["_id"])
    resume_text = "Experienced Developer with Python, JavaScript, and NLP skills."
    db_resume = await crud.create_resume(user_id, "test_resume.txt", "uploads/test_resume.txt", resume_text, len(resume_text.split()))
    assert db_resume is not None, "Failed to save resume document"
    assert db_resume["user_id"] == user_id, "Resume user_id mismatch"
    print(f"[OK] Saved resume document linked to user: {db_resume['filename']} (Word count: {db_resume['word_count']})")

    # 6. Retrieve Resumes list
    resumes_list = await crud.get_resumes_by_user(user_id)
    assert len(resumes_list) > 0, "Retrieve resumes list returned empty"
    print(f"[OK] Retrieved user resumes history list. Count: {len(resumes_list)}")

    # 7. Create Analysis log
    mock_results = {"ats_score": 75, "skills": {"matched": ["Python"], "missing": ["FastAPI"]}}
    db_analysis = await crud.create_analysis(
        user_id=user_id,
        resume_filename="test_resume.txt",
        job_title="Backend Developer",
        ats_score=75,
        semantic_score=80,
        keyword_score=70,
        skills_match_score=65,
        formatting_score=90,
        experience_score=85,
        results=mock_results
    )
    assert db_analysis is not None, "Failed to save analysis document"
    assert db_analysis["ats_score"] == 75, "Analysis score mismatch"
    print(f"[OK] Saved analysis log document. Score: {db_analysis['ats_score']}% (Target: {db_analysis['job_title']})")

    # 8. Query analyses list and verify isolation
    analyses_list = await crud.get_analyses_by_user(user_id)
    assert len(analyses_list) > 0, "Query analyses list returned empty"
    
    # Confirm another user cannot retrieve
    other_user_analyses = await crud.get_analyses_by_user("60b9f0000000000000000000")
    assert len(other_user_analyses) == 0, "Data isolation leak detected! Retrieved other user's records."
    print(f"[OK] Verified strict data isolation constraints. Other user query returned 0 records.")

    # 9. Delete Analysis item
    delete_success = await crud.delete_analysis_by_id(user_id, str(db_analysis["_id"]))
    assert delete_success, "Analysis delete operation failed"
    print(f"[OK] Deleted analysis record by ID successfully.")

    # Clean up test user
    await users_collection.delete_many({"email": test_email})
    await resumes_collection.delete_many({"user_id": user_id})
    await analyses_collection.delete_many({"user_id": user_id})
    print("[OK] Cleaned up test database collections.")
    print("\nSUCCESS: All MongoDB database CRUD operations verify successfully with data isolation!")

if __name__ == "__main__":
    asyncio.run(test_db())
