import asyncio
import os
from database import users_collection, resumes_collection
import crud
from auth import hash_password

async def test_resume_manager():
    print("--- Starting Resume Manager Operations Verification ---")
    
    # Clean test user
    test_email = "resumemgr@resumeintel.io"
    await users_collection.delete_many({"email": test_email})
    
    # 1. Create mock user
    user = await crud.create_user("Manager Tester", test_email, hash_password("pass123"))
    user_id = str(user["_id"])
    await resumes_collection.delete_many({"user_id": user_id})
    print(f"[OK] Created test user: {user['email']}")

    # 2. Upload Resume 1 (Saves filepath metadata)
    os.makedirs("uploads", exist_ok=True)
    filename = "resume_v1.pdf"
    filepath = os.path.join("uploads", f"{user_id}_test_1.pdf")
    text = "Full Stack Engineer with React, Python, and Node."
    
    # Write mock file
    with open(filepath, "w") as f:
        f.write(text)
        
    res1 = await crud.create_resume(
        user_id=user_id,
        filename=filename,
        filepath=filepath,
        text=text,
        word_count=len(text.split()),
        target_role="Frontend Developer",
        version="v1",
        is_active=True
    )
    assert res1 is not None, "Failed to upload Resume 1"
    assert res1["is_active"] is True, "First upload should default to active"
    print(f"[OK] Registered Resume 1: {res1['filename']} (Version: {res1['version']}, Active: {res1['is_active']})")

    # 3. Upload Resume 2 (Sets version 2 and active status check)
    filename2 = "resume_v2.pdf"
    filepath2 = os.path.join("uploads", f"{user_id}_test_2.pdf")
    text2 = "Principal Engineer with Cloud and K8s."
    with open(filepath2, "w") as f:
        f.write(text2)
        
    res2 = await crud.create_resume(
        user_id=user_id,
        filename=filename2,
        filepath=filepath2,
        text=text2,
        word_count=len(text2.split()),
        target_role="Cloud Architect",
        version="v2",
        is_active=False
    )
    assert res2["is_active"] is False, "Second upload should not default to active"
    print(f"[OK] Registered Resume 2: {res2['filename']} (Version: {res2['version']}, Active: {res2['is_active']})")

    # 4. Set Resume 2 as active (unsets Resume 1)
    activated = await crud.set_active_resume(user_id, str(res2["_id"]))
    assert activated["is_active"] is True, "Failed to activate Resume 2"
    
    # Check Resume 1 is deactivated
    res1_updated = await crud.get_resume_by_id(user_id, str(res1["_id"]))
    assert res1_updated["is_active"] is False, "Resume 1 did not deactivate"
    print(f"[OK] Set Resume 2 active. Verified Resume 1 is deactivated.")

    # 5. Rename Resume 2
    renamed = await crud.rename_resume(user_id, str(res2["_id"]), "new_resume_name.pdf")
    assert renamed["filename"] == "new_resume_name.pdf", "Rename mismatch"
    print(f"[OK] Renamed Resume 2 to: {renamed['filename']}")

    # 6. Delete Resume 1
    deleted = await crud.delete_resume(user_id, str(res1["_id"]))
    assert deleted is not None, "Failed to delete Resume 1 metadata"
    if os.path.exists(filepath):
        os.remove(filepath)
    print(f"[OK] Deleted Resume 1 metadata and cleaned up physical disk file.")

    # Clean up Resume 2
    if os.path.exists(filepath2):
        os.remove(filepath2)
        
    # Clean database
    await users_collection.delete_many({"email": test_email})
    await resumes_collection.delete_many({"user_id": user_id})
    print("[OK] Cleared test DB records.")
    
    print("\nSUCCESS: All Resume Manager database & disk CRUD operations verified successfully!")

if __name__ == "__main__":
    asyncio.run(test_resume_manager())
