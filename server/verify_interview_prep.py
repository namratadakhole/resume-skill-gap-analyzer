import asyncio
from database import users_collection, interview_preps_collection
import crud
from auth import hash_password

async def test_interview_prep():
    print("--- Starting Interview Prep Operations Verification ---")
    
    # Clean test user
    test_email = "prepmgr@resumeintel.io"
    await users_collection.delete_many({"email": test_email})
    
    # 1. Create mock user
    user = await crud.create_user("Prep Tester", test_email, hash_password("pass123"))
    user_id = str(user["_id"])
    await interview_preps_collection.delete_many({"user_id": user_id})
    print(f"[OK] Created test user: {user['email']}")

    # 2. Save prep entry
    technical = [
        {
            "skill": "Docker",
            "difficulty": "Medium",
            "prep_time": "3 hours",
            "questions": [
                {"question": "What is Docker?", "answer": "Container virtualization.", "level": "Beginner"}
            ]
        }
    ]
    prep_log = await crud.create_interview_prep(
        user_id=user_id,
        resume_name="test_resume.pdf",
        job_title="DevOps Engineer",
        difficulty_level="Medium",
        estimated_prep_time="3 hours total",
        technical_questions=technical,
        hr_questions=[{"question": "Why devops?", "answer": "Automation."}],
        behavioral_questions=[{"question": "Flipped release?", "answer": "Fixed script."}],
        coding_questions=[{"question": "Check palindrome?", "answer": "Reversed."}],
        top_tips=["Be structured."],
        recommended_topics=["Containers"]
    )
    assert prep_log is not None, "Failed to create prep log"
    assert len(prep_log["technical_questions"]) == 1, "Technical section mismatch"
    print(f"[OK] Logged interview prep: {prep_log['resume_name']}")

    # 3. Retrieve history
    history = await crud.get_interview_preps_by_user(user_id)
    assert len(history) == 1, "Failed to retrieve history"
    print(f"[OK] Retrieved user prep logs. Count: {len(history)}")

    # Clean up test database
    await users_collection.delete_many({"email": test_email})
    await interview_preps_collection.delete_many({"user_id": user_id})
    print("[OK] Cleared test DB records.")
    
    print("\nSUCCESS: All Interview Prep database CRUD operations verified successfully!")

if __name__ == "__main__":
    asyncio.run(test_interview_prep())
