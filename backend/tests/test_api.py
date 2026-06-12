import asyncio
from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select, update

from app.models import Challenge, Submission, SubmissionStatus, User, UserChallengeWindow
from tests.helpers import auth_headers, internal_headers, payload_for_task, register_user


@pytest.mark.asyncio
async def test_feed_blindfolded_without_submission(client, db_session):
    await client.post("/api/v1/internal/challenges/release", headers=internal_headers())
    user = await register_user(client, "blinduser")
    response = await client.get("/api/v1/challenges/today/feed", headers=auth_headers(user))
    assert response.status_code == 403
    assert response.json()["code"] == "FEED_BLINDFOLDED"


@pytest.mark.asyncio
async def test_feed_unlocks_after_success(client, db_session):
    await client.post("/api/v1/internal/challenges/release", headers=internal_headers())
    user = await register_user(client, "feeduser")
    headers = auth_headers(user)

    today = await client.get("/api/v1/challenges/today", headers=headers)
    task_type = today.json()["task"]["task_type"]

    payload = await payload_for_task(client, user, task_type, text_value="grateful for tests")

    submit = await client.post("/api/v1/submissions", json=payload, headers=headers)
    assert submit.status_code == 201

    submission_id = submit.json()["data"]["id"]
    await asyncio.sleep(0.1)

    result = await db_session.execute(select(Submission).where(Submission.id == submission_id))
    submission = result.scalar_one()
    submission.status = SubmissionStatus.SUCCESS
    await db_session.commit()

    feed = await client.get("/api/v1/challenges/today/feed", headers=headers)
    assert feed.status_code == 200
    assert len(feed.json()["items"]) >= 1


@pytest.mark.asyncio
async def test_submission_rejected_after_window_closed(client, db_session):
    await client.post("/api/v1/internal/challenges/release", headers=internal_headers())
    user = await register_user(client, "lateuser")
    headers = auth_headers(user)

    today = await client.get("/api/v1/challenges/today", headers=headers)
    challenge_id = today.json()["challenge_id"]

    await db_session.execute(
        update(UserChallengeWindow)
        .where(UserChallengeWindow.challenge_id == challenge_id)
        .values(closes_at=datetime.now(timezone.utc) - timedelta(hours=1))
    )
    await db_session.commit()

    task_type = today.json()["task"]["task_type"]
    payload = await payload_for_task(client, user, task_type, text_value="too late", number_value="1")

    response = await client.post("/api/v1/submissions", json=payload, headers=headers)
    assert response.status_code == 403
    assert response.json()["code"] == "WINDOW_CLOSED"


@pytest.mark.asyncio
async def test_ghost_deploy_concurrency(client, db_session, engine):
    await client.post("/api/v1/internal/challenges/release", headers=internal_headers())
    user = await register_user(client, "ghostuser")
    headers = auth_headers(user)

    today = await client.get("/api/v1/challenges/today", headers=headers)
    challenge_id = today.json()["challenge_id"]

    await db_session.execute(
        update(UserChallengeWindow)
        .where(UserChallengeWindow.challenge_id == challenge_id)
        .values(closes_at=datetime.now(timezone.utc) - timedelta(hours=1))
    )
    await db_session.commit()

    user_row = await db_session.execute(select(User).where(User.username == "ghostuser"))
    user_model = user_row.scalar_one()

    from fastapi import HTTPException
    from sqlalchemy.ext.asyncio import async_sessionmaker

    from app.services.ghost import deploy_ghost

    factory = async_sessionmaker(engine, expire_on_commit=False)

    async def attempt() -> int | str:
        async with factory() as session:
            try:
                await deploy_ghost(session, user_model.id, challenge_id)
                await session.commit()
                return 200
            except HTTPException as exc:
                await session.rollback()
                return exc.status_code

    results = await asyncio.gather(attempt(), attempt())
    assert sorted(results) == [200, 409]


@pytest.mark.asyncio
async def test_streak_counts_consecutive_successes(client, db_session):
    user = await register_user(client, "streakuser")
    headers = auth_headers(user)

    for _ in range(3):
        await client.post("/api/v1/internal/challenges/release", headers=internal_headers())

    challenges = (await db_session.execute(select(Challenge).order_by(Challenge.sequence_number))).scalars().all()
    assert len(challenges) == 3

    user_row = await db_session.execute(select(User).where(User.username == "streakuser"))
    user = user_row.scalar_one()

    from app.services.challenge_release import ensure_user_window

    for challenge in challenges:
        await ensure_user_window(db_session, user, challenge)
    await db_session.commit()

    for challenge in challenges:
        submission = Submission(
            user_id=user.id,
            challenge_id=challenge.id,
            status=SubmissionStatus.SUCCESS,
            text_value="done",
            submitted_at=datetime.now(timezone.utc),
        )
        db_session.add(submission)
    await db_session.commit()

    streak_response = await client.get("/api/v1/users/me/streak", headers=headers)
    assert streak_response.status_code == 200
    assert streak_response.json()["streak"] == 3


@pytest.mark.asyncio
async def test_upload_image_returns_url(client, db_session):
    await client.post("/api/v1/internal/challenges/release", headers=internal_headers())
    user = await register_user(client, "uploaduser")
    headers = auth_headers(user)

    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00"
        b"\x01\x01\x01\x00\x18\xdd\x8d\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    response = await client.post(
        "/api/v1/uploads",
        headers=headers,
        files={"file": ("proof.png", png_bytes, "image/png")},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["image_url"].startswith("http://")
    assert "/uploads/" in body["image_url"]

    items = await client.get("/api/v1/users/me/items", headers=headers)
    assert items.status_code == 200
    assert items.json()["ghost"] == 1

