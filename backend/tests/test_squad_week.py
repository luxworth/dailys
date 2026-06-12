from datetime import date, datetime, timedelta, timezone

import pytest
from sqlalchemy import select

from app.models import (
    Challenge,
    ChallengeStatus,
    SquadMembership,
    SquadMemberStatus,
    Submission,
    SubmissionStatus,
    TaskTemplate,
    User,
)
from app.services.squad_week import close_week, ensure_current_week, monday_of_week, sunday_of_week
from tests.helpers import auth_headers, internal_headers, register_user


@pytest.mark.asyncio
async def test_week_boundaries():
    day = date(2026, 6, 12)  # Friday
    assert monday_of_week(day) == date(2026, 6, 8)
    assert sunday_of_week(day) == date(2026, 6, 14)


@pytest.mark.asyncio
async def test_close_week_eliminates_lowest_performer(client, db_session):
    leader = await register_user(client, "weekleader")
    member_b = await register_user(client, "memberb")
    member_c = await register_user(client, "memberc")

    created = await client.post(
        "/api/v1/squads",
        json={"name": "Week Squad"},
        headers=auth_headers(leader),
    )
    squad_id = created.json()["squad_id"]
    invite = created.json()["invite_code"]

    await client.post(
        "/api/v1/squads/join",
        json={"invite_code": invite},
        headers=auth_headers(member_b),
    )
    await client.post(
        "/api/v1/squads/join",
        json={"invite_code": invite},
        headers=auth_headers(member_c),
    )

    week = await ensure_current_week(db_session, squad_id)
    await db_session.commit()

    template_result = await db_session.execute(select(TaskTemplate).limit(1))
    template = template_result.scalar_one()

    user_rows = await db_session.execute(select(User))
    user_by_username = {u.username: u for u in user_rows.scalars().all()}

    sequence = 9000
    weekly_counts = {"weekleader": 2, "memberb": 1, "memberc": 0}
    for username, successes in weekly_counts.items():
        user = user_by_username[username]
        for _ in range(successes):
            challenge = Challenge(
                sequence_number=sequence,
                task_template_id=template.id,
                released_at=datetime.combine(week.week_start, datetime.min.time(), tzinfo=timezone.utc),
                status=ChallengeStatus.CLOSED,
            )
            db_session.add(challenge)
            await db_session.flush()
            sequence += 1

            db_session.add(
                Submission(
                    user_id=user.id,
                    challenge_id=challenge.id,
                    status=SubmissionStatus.SUCCESS,
                    text_value="done",
                )
            )

    await db_session.commit()

    eliminated_id = await close_week(db_session, squad_id)
    await db_session.commit()

    assert eliminated_id == user_by_username["memberc"].id

    memberships = await db_session.execute(
        select(SquadMembership).where(SquadMembership.squad_id == squad_id)
    )
    status_by_user = {m.user_id: m.status for m in memberships.scalars().all()}
    assert status_by_user[user_by_username["memberc"].id] == SquadMemberStatus.ELIMINATED

    leaderboard = await client.get(
        f"/api/v1/squads/{squad_id}/leaderboard",
        headers=auth_headers(leader),
    )
    entries = {entry["username"]: entry for entry in leaderboard.json()["entries"]}
    assert entries["memberc"]["status"] == "ELIMINATED"


@pytest.mark.asyncio
async def test_internal_close_week_route(client, db_session):
    user_a = await register_user(client, "closea")
    user_b = await register_user(client, "closeb")
    user_c = await register_user(client, "closec")

    created = await client.post(
        "/api/v1/squads",
        json={"name": "Close Route"},
        headers=auth_headers(user_a),
    )
    invite = created.json()["invite_code"]
    await client.post("/api/v1/squads/join", json={"invite_code": invite}, headers=auth_headers(user_b))
    await client.post("/api/v1/squads/join", json={"invite_code": invite}, headers=auth_headers(user_c))

    response = await client.post("/api/v1/internal/squads/close-week", headers=internal_headers())
    assert response.status_code == 200
    body = response.json()
    assert body["squads_processed"] >= 1
    assert isinstance(body["eliminations"], list)
