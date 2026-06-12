from datetime import datetime, timedelta, timezone

import pytest
from sqlalchemy import select, update

from app.models import Challenge, Submission, SubmissionStatus, User, UserChallengeWindow
from app.models.enums import AudioType, HapticType, SubmissionStatus as SS, TaskType
from app.services.challenge_release import ensure_user_window
from app.services.interaction import (
    MILESTONE_STREAK_7,
    MILESTONE_STREAK_30,
    build_elimination_interaction,
    build_ghost_deploy_interaction,
    build_submission_interaction,
)
from tests.helpers import auth_headers, internal_headers, payload_for_task, register_user


def test_build_submission_number_default():
    meta = build_submission_interaction(TaskType.NUMBER, SS.SUCCESS, 3, 4)
    assert meta.haptic == HapticType.MEDIUM
    assert meta.audio == AudioType.CALCULATOR_CLICK
    assert meta.milestone is None


def test_build_submission_streak_7_milestone():
    meta = build_submission_interaction(TaskType.NUMBER, SS.SUCCESS, 6, 7)
    assert meta.haptic == HapticType.SUCCESS_CHIME
    assert meta.audio == AudioType.ORCHESTRA_CRESCENDO
    assert meta.milestone == MILESTONE_STREAK_7


def test_build_submission_streak_30_milestone():
    meta = build_submission_interaction(TaskType.TEXT, SS.SUCCESS, 29, 30)
    assert meta.haptic == HapticType.SUCCESS_CHIME
    assert meta.audio == AudioType.PLASMA_IGNITION
    assert meta.milestone == MILESTONE_STREAK_30


def test_build_submission_streak_30_precedence_over_7():
    meta = build_submission_interaction(TaskType.NUMBER, SS.SUCCESS, 0, 30)
    assert meta.milestone == MILESTONE_STREAK_30


def test_build_submission_failure():
    meta = build_submission_interaction(TaskType.NUMBER, SS.FAILED, 5, 5)
    assert meta.haptic == HapticType.FAILURE_BUZZ
    assert meta.audio == AudioType.ERROR_DULL


def test_build_ghost_and_elimination():
    ghost = build_ghost_deploy_interaction()
    assert ghost.haptic == HapticType.LIGHT
    assert ghost.audio == AudioType.MATCH_STRIKE

    elim = build_elimination_interaction()
    assert elim.haptic == HapticType.FAILURE_BUZZ
    assert elim.audio == AudioType.ERROR_DULL


@pytest.mark.asyncio
async def test_number_submission_default_haptic(client, db_session):
    await client.post("/api/v1/internal/challenges/release", headers=internal_headers())
    user = await register_user(client, "hapticuser")
    headers = auth_headers(user)

    today = await client.get("/api/v1/challenges/today", headers=headers)
    task_type = today.json()["task"]["task_type"]
    payload = await payload_for_task(client, user, task_type, number_value="42", text_value="hello")

    response = await client.post("/api/v1/submissions", json=payload, headers=headers)
    assert response.status_code == 201
    body = response.json()
    assert "interaction" in body
    assert body["data"]["status"] == "SUCCESS"

    if task_type == "NUMBER":
        assert body["interaction"]["haptic"] == "MEDIUM"
        assert body["interaction"]["audio"] == "CALCULATOR_CLICK"
    else:
        assert body["interaction"]["haptic"] == "MEDIUM"
        assert body["interaction"]["audio"] == "MATCH_STRIKE"


@pytest.mark.asyncio
async def test_submission_streak_7_milestone_integration(client, db_session):
    user = await register_user(client, "sevenuser")
    headers = auth_headers(user)

    user_row = await db_session.execute(select(User).where(User.username == "sevenuser"))
    user_model = user_row.scalar_one()

    for _ in range(6):
        await client.post("/api/v1/internal/challenges/release", headers=internal_headers())

    challenges = (
        await db_session.execute(select(Challenge).order_by(Challenge.sequence_number))
    ).scalars().all()
    assert len(challenges) == 6

    for challenge in challenges:
        await ensure_user_window(db_session, user_model, challenge)
        db_session.add(
            Submission(
                user_id=user_model.id,
                challenge_id=challenge.id,
                status=SubmissionStatus.SUCCESS,
                text_value="done",
                submitted_at=datetime.now(timezone.utc),
            )
        )
    await db_session.commit()

    await client.post("/api/v1/internal/challenges/release", headers=internal_headers())
    today = await client.get("/api/v1/challenges/today", headers=headers)
    task_type = today.json()["task"]["task_type"]
    payload = await payload_for_task(client, user, task_type, number_value="7", text_value="day7")

    response = await client.post("/api/v1/submissions", json=payload, headers=headers)
    assert response.status_code == 201
    interaction = response.json()["interaction"]
    assert interaction["haptic"] == "SUCCESS_CHIME"
    assert interaction["audio"] == "ORCHESTRA_CRESCENDO"
    assert interaction["milestone"] == "STREAK_7"


@pytest.mark.asyncio
async def test_submission_failure_haptic(client, db_session, monkeypatch):
    from app.models.enums import SubmissionStatus as SS

    class FailingProvider:
        async def verify(self, *_args, **_kwargs):
            return SS.FAILED, {"mode": "test", "passed": False}

    monkeypatch.setattr(
        "app.services.verification.get_verification_provider",
        lambda: FailingProvider(),
    )

    await client.post("/api/v1/internal/challenges/release", headers=internal_headers())
    user = await register_user(client, "failuser")
    headers = auth_headers(user)

    today = await client.get("/api/v1/challenges/today", headers=headers)
    task_type = today.json()["task"]["task_type"]
    payload = await payload_for_task(client, user, task_type, number_value="1", text_value="nope")

    response = await client.post("/api/v1/submissions", json=payload, headers=headers)
    assert response.status_code == 201
    body = response.json()
    assert body["data"]["status"] == "FAILED"
    assert body["interaction"]["haptic"] == "FAILURE_BUZZ"
    assert body["interaction"]["audio"] == "ERROR_DULL"


@pytest.mark.asyncio
async def test_ghost_deploy_interaction(client, db_session):
    await client.post("/api/v1/internal/challenges/release", headers=internal_headers())
    user = await register_user(client, "ghosthaptic")
    headers = auth_headers(user)

    today = await client.get("/api/v1/challenges/today", headers=headers)
    challenge_id = today.json()["challenge_id"]

    await db_session.execute(
        update(UserChallengeWindow)
        .where(UserChallengeWindow.challenge_id == challenge_id)
        .values(closes_at=datetime.now(timezone.utc) - timedelta(hours=1))
    )
    await db_session.commit()

    response = await client.post(
        "/api/v1/ghost/deploy",
        json={"challenge_id": challenge_id},
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["interaction"]["haptic"] == "LIGHT"
    assert body["interaction"]["audio"] == "MATCH_STRIKE"
