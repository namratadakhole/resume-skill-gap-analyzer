import asyncio
from database import users_collection, rewrites_collection
import crud
from auth import hash_password

async def test_rewrite_module():
    print("--- Starting AI Resume Rewrite Operations Verification ---")
    
    # Clean test user
    test_email = "rewritemgr@resumeintel.io"
    await users_collection.delete_many({"email": test_email})
    
    # 1. Create mock user
    user = await crud.create_user("Rewrite Tester", test_email, hash_password("pass123"))
    user_id = str(user["_id"])
    await rewrites_collection.delete_many({"user_id": user_id})
    print(f"[OK] Created test user: {user['email']}")

    # 2. Save rewrite log entry
    sections = [
        {
            "name": "Professional Summary",
            "original_text": "Experienced web dev.",
            "improved_text": "Experienced Software Engineer with Python skills.",
            "changes_made": ["Added target job title", "Injected Python skill"],
            "ats_impact": "Raises keyword frequency scores."
        }
    ]
    rewrite_log = await crud.create_rewrite_history(
        user_id=user_id,
        resume_name="test_resume.pdf",
        sections=sections
    )
    assert rewrite_log is not None, "Failed to log rewrite history"
    assert len(rewrite_log["sections"]) == 1, "Section count mismatch"
    print(f"[OK] Logged rewrite metadata: {rewrite_log['resume_name']}")

    # 3. Retrieve rewrite history
    history = await crud.get_rewrites_by_user(user_id)
    assert len(history) == 1, "Failed to retrieve rewrite history"
    print(f"[OK] Retrieved user rewrite logs. Count: {len(history)}")

    # Clean up test database
    await users_collection.delete_many({"email": test_email})
    await rewrites_collection.delete_many({"user_id": user_id})
    print("[OK] Cleared test DB records.")
    
    print("\nSUCCESS: All AI Resume Rewrite database CRUD operations verified successfully!")

if __name__ == "__main__":
    asyncio.run(test_rewrite_module())
