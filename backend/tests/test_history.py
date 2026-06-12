from datetime import datetime, timezone
from uuid import UUID

import pytest
from sqlalchemy import select

from app.models import Challenge, Submission, SubmissionStatus, User
from app.services.challenge_release import ensure_user_window
from tests.helpers import auth_headers, internal_headers, register_user


@pytest.mark.asyncio
async def test_user_history_calendar_and_trace(client, db_session):
    user = await register_user(client, "historyuser")
    headers = auth_headers(user)

    user_row = await db_session.execute(select(User).where(User.username == "historyuser"))
    user_model = user_row.scalar_one()

    challenge_ids = []
    for _ in range(3):
        release = await client.post(
            "/api/v1/internal/challenges/release",
            headers=internal_headers(),
        )
        challenge_ids.append(UUID(release.json()["challenge_id"]))

    challenges = (
        await db_session.execute(
            select(Challenge).where(Challenge.id.in_(challenge_ids)).order_by(Challenge.sequence_number)
        )
    ).scalars().all()

    for challenge in challenges:
        await ensure_user_window(db_session, user_model, challenge)

    for challenge in challenges[-2:]:
        submission = Submission(
            user_id=user_model.id,
            challenge_id=challenge.id,
            status=SubmissionStatus.SUCCESS,
            text_value="done",
            submitted_at=datetime.now(timezone.utc),
        )
        db_session.add(submission)
    await db_session.commit()

    response = await client.get("/api/v1/users/me/history", headers=headers)
    assert response.status_code == 200
    body = response.json()

    assert body["streak"] == 2
    assert len(body["days"]) == 30
    assert len(body["trace"]) == 2
    assert body["trace"][0]["title"]
    assert body["trace"][0]["submission_preview"] == "done"

    success_days = [d for d in body["days"] if d["status"] == "SUCCESS"]
    assert len(success_days) >= 1
