import asyncio
from database import users_collection, project_recommendations_collection
import crud
from auth import hash_password

async def test_project_recs():
    print("--- Starting Project Recommendations Verification ---")
    
    # Clean test user
    test_email = "recmgr@resumeintel.io"
    await users_collection.delete_many({"email": test_email})
    
    # 1. Create mock user
    user = await crud.create_user("Rec Tester", test_email, hash_password("pass123"))
    user_id = str(user["_id"])
    await project_recommendations_collection.delete_many({"user_id": user_id})
    print(f"[OK] Created test user: {user['email']}")

    # 2. Save recommendation logs
    projects = [
        {
            "name": "Distributed Analytics Engine",
            "description": "Caching layer using MongoDB and Redis.",
            "technologies": ["MongoDB", "Redis", "Python"],
            "difficulty": "Intermediate",
            "duration": "1.5 Weeks",
            "skills_covered": ["MongoDB", "Redis"],
            "learning_outcome": "Master transactional caching.",
            "priority": "High",
            "github_readiness": 5
        }
    ]
    rec_log = await crud.create_project_recommendation(
        user_id=user_id,
        resume_name="test_resume.pdf",
        job_title="ML Engineer",
        projects=projects
    )
    assert rec_log is not None, "Failed to create project rec log"
    assert len(rec_log["projects"]) == 1, "Project catalog mismatch"
    print(f"[OK] Logged project recommendations: {rec_log['resume_name']}")

    # 3. Retrieve history
    history = await crud.get_project_recommendations_by_user(user_id)
    assert len(history) == 1, "Failed to retrieve history"
    print(f"[OK] Retrieved user recommendation logs. Count: {len(history)}")

    # Clean up test database
    await users_collection.delete_many({"email": test_email})
    await project_recommendations_collection.delete_many({"user_id": user_id})
    print("[OK] Cleared test DB records.")
    
    print("\nSUCCESS: All Project Recommendations database CRUD operations verified successfully!")

if __name__ == "__main__":
    asyncio.run(test_project_recs())
