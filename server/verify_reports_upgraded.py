import asyncio
import os
from database import users_collection, reports_collection, analyses_collection
import crud
from auth import hash_password

async def test_reports_upgraded():
    print("--- Starting Upgraded Reports Operations Verification ---")
    
    # Clean test user
    test_email = "reportsmgr@resumeintel.io"
    await users_collection.delete_many({"email": test_email})
    
    # 1. Create mock user
    user = await crud.create_user("Reports Tester", test_email, hash_password("pass123"))
    user_id = str(user["_id"])
    await reports_collection.delete_many({"user_id": user_id})
    print(f"[OK] Created test user: {user['email']}")

    # 2. Log report entry
    report_log = await crud.create_report_log(
        user_id=user_id,
        filename="test_resume_ATS_Report.pdf",
        resume_name="test_resume.pdf",
        job_title="Software Architect",
        ats_score=85.5
    )
    assert report_log is not None, "Failed to create report log"
    assert report_log["download_count"] == 0, "Initial download count should be 0"
    print(f"[OK] Logged report metadata: {report_log['filename']}")

    # 3. Increment download counter
    tracked = await crud.increment_report_download(user_id, str(report_log["_id"]))
    assert tracked["download_count"] == 1, "Download count increment failed"
    assert tracked["last_downloaded"] is not None, "Last downloaded timestamp not set"
    print(f"[OK] Tracked report download. Counter: {tracked['download_count']}, Last Downloaded: {tracked['last_downloaded']}")

    # 4. Delete report log
    deleted = await crud.delete_report_log(user_id, str(report_log["_id"]))
    assert deleted is True, "Failed to delete report log"
    print(f"[OK] Deleted report log metadata successfully.")

    # Clean up test database
    await users_collection.delete_many({"email": test_email})
    await reports_collection.delete_many({"user_id": user_id})
    print("[OK] Cleared test DB records.")
    
    print("\nSUCCESS: All Upgraded Reports database CRUD operations verified successfully!")

if __name__ == "__main__":
    asyncio.run(test_reports_upgraded())
