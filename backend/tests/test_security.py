from uuid import UUID

import pytest
from sqlalchemy import select

from app.config import get_settings
from app.models import Submission, SubmissionStatus
from tests.helpers import auth_headers, internal_headers, payload_for_task, register_user


@pytest.mark.asyncio
async def test_internal_release_requires_key(client, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "staging")
    monkeypatch.setenv("INTERNAL_API_KEY", "staging-secret-key")
    get_settings.cache_clear()

    response = await client.post("/api/v1/internal/challenges/release")
    assert response.status_code == 403
    assert response.json()["code"] == "FORBIDDEN"


@pytest.mark.asyncio
async def test_internal_release_with_key(client):
    response = await client.post(
        "/api/v1/internal/challenges/release",
        headers=internal_headers(),
    )
    assert response.status_code == 200
    assert "challenge_id" in response.json()


@pytest.mark.asyncio
async def test_register_invalid_timezone(client):
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "badtz@example.com",
            "username": "badtzuser",
            "password": "password123",
            "timezone": "Not/A_Real_Zone",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_reaction_blocked_without_feed_access(client, db_session):
    await client.post("/api/v1/internal/challenges/release", headers=internal_headers())
    user = await register_user(client, "reactuser")
    headers = auth_headers(user)

    other = await register_user(client, "otheruser")
    other_headers = auth_headers(other)

    today = await client.get("/api/v1/challenges/today", headers=other_headers)
    task_type = today.json()["task"]["task_type"]
    payload = await payload_for_task(client, other, task_type, text_value="proof", number_value="7")

    submit = await client.post("/api/v1/submissions", json=payload, headers=other_headers)
    assert submit.status_code == 201
    submission_id = UUID(submit.json()["data"]["id"])

    result = await db_session.execute(select(Submission).where(Submission.id == submission_id))
    submission = result.scalar_one()
    submission.status = SubmissionStatus.SUCCESS
    await db_session.commit()

    response = await client.put(
        f"/api/v1/submissions/{submission_id}/reaction",
        json={"reaction_type": "RESPECT"},
        headers=headers,
    )
    assert response.status_code == 403
    assert response.json()["code"] == "FEED_BLINDFOLDED"


@pytest.mark.asyncio
async def test_health_and_ready(client):
    health = await client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    ready = await client.get("/ready")
    assert ready.status_code == 200
    assert ready.json()["status"] == "ready"


def test_cors_origins_comma_separated(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://a.com,https://b.com")
    get_settings.cache_clear()
    settings = get_settings()
    assert settings.cors_origins == ["https://a.com", "https://b.com"]
    get_settings.cache_clear()
