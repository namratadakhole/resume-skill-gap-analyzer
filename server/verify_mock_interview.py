import asyncio
from database import users_collection, mock_interviews_collection
import crud
from auth import hash_password

async def test_mock_interview():
    print("--- Starting AI Mock Interview /api/interview Upgraded Verification ---")
    
    # Clean test user
    test_email = "voiceupg2@resumeintel.io"
    await users_collection.delete_many({"email": test_email})
    
    # 1. Create mock user
    user = await crud.create_user("Upgraded Voice Tester 2", test_email, hash_password("pass123"))
    user_id = str(user["_id"])
    await mock_interviews_collection.delete_many({"user_id": user_id})
    print(f"[OK] Created test user: {user['email']}")

    # 2. Start mock interview
    questions = ["Q1?", "Q2?"]
    interview = await crud.create_mock_interview(
        user_id=user_id,
        job_title="DevOps Architect",
        interview_type="System Design",
        difficulty_level="Hard",
        duration=30,
        questions=questions
    )
    assert interview is not None, "Failed to create mock interview session"
    assert interview["interview_type"] == "System Design", "Type mismatch"
    assert interview["difficulty_level"] == "Hard", "Difficulty mismatch"
    assert interview["duration"] == 30, "Duration mismatch"
    print(f"[OK] Logged mock interview: {interview['job_title']}")

    # 3. Update evaluation
    evaluation = {
        "technical_relevance": 90.0,
        "completeness": 80.0,
        "communication_clarity": 90.0,
        "keyword_coverage": 85.0,
        "speaking_pace": 135.0,
        "filler_words": 1,
        "answer_length": 42,
        "grammar_quality": 95.0,
        "semantic_similarity": 88.0,
        "score": 88.0,
        "strengths": ["Clear speech."],
        "weaknesses": [],
        "model_answer": "Model.",
        "suggested_improvement": "More data."
    }
    updated = await crud.update_mock_interview_evaluations(
        user_id=user_id,
        interview_id=str(interview["_id"]),
        question_idx=0,
        answer="I use Docker volumes for storage persistence.",
        evaluation=evaluation
    )
    assert updated is not None, "Failed to update evaluations"
    assert updated["answers"][0] == "I use Docker volumes for storage persistence.", "Failed to save answers"
    print("[OK] Logged answer evaluation successfully.")

    # 4. Finalize
    final = await crud.finalize_mock_interview(
        user_id=user_id,
        interview_id=str(interview["_id"]),
        overall_score=88.0,
        technical_score=87.5,
        communication_score=92.5,
        semantic_match_score=88.0,
        avg_response_time=24.5,
        avg_answer_length=42.0,
        filler_word_count=1,
        strongest_answer="Q1?",
        weakest_answer="Q2?",
        report_summary="Passed mock session."
    )
    assert final["overall_score"] == 88.0, "Score finalize mismatch"
    assert final["technical_score"] == 87.5, "Tech score mismatch"
    assert final["filler_word_count"] == 1, "Filler count mismatch"
    print("[OK] Finalized mock session report.")

    # 5. History retrieval
    history = await crud.get_mock_interviews_by_user(user_id)
    assert len(history) == 1, "Failed to retrieve history"
    print("[OK] Retrieved history logs successfully.")

    # 6. Session deletion
    deleted = await crud.delete_mock_interview_session(user_id, str(interview["_id"]))
    assert deleted is True, "Failed to delete session"
    print("[OK] Deleted session successfully.")

    # Clean up test database
    await users_collection.delete_many({"email": test_email})
    print("[OK] Cleared test DB records.")
    
    print("\nSUCCESS: All Upgraded AI Mock Interview /api/interview database CRUD operations verified successfully!")

if __name__ == "__main__":
    asyncio.run(test_mock_interview())
