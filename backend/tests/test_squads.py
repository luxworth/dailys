import pytest

from tests.helpers import auth_headers, internal_headers, register_user


@pytest.mark.asyncio
async def test_create_squad(client):
    user = await register_user(client, "squadcreator")
    headers = auth_headers(user)

    response = await client.post(
        "/api/v1/squads",
        json={"name": "Protocol Squad"},
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Protocol Squad"
    assert len(body["invite_code"]) >= 6

    me = await client.get("/api/v1/users/me/squad", headers=headers)
    assert me.status_code == 200
    assert me.json()["squad_id"] == body["squad_id"]
    assert me.json()["member_count"] == 1


@pytest.mark.asyncio
async def test_join_squad(client):
    creator = await register_user(client, "creator")
    creator_headers = auth_headers(creator)

    created = await client.post(
        "/api/v1/squads",
        json={"name": "Join Test"},
        headers=creator_headers,
    )
    invite_code = created.json()["invite_code"]
    squad_id = created.json()["squad_id"]

    joiner = await register_user(client, "joiner")
    join_headers = auth_headers(joiner)

    response = await client.post(
        "/api/v1/squads/join",
        json={"invite_code": invite_code},
        headers=join_headers,
    )
    assert response.status_code == 200
    assert response.json()["member_count"] == 2

    leaderboard = await client.get(
        f"/api/v1/squads/{squad_id}/leaderboard",
        headers=join_headers,
    )
    assert leaderboard.status_code == 200
    assert len(leaderboard.json()["entries"]) == 2


@pytest.mark.asyncio
async def test_already_in_squad_conflict(client):
    user = await register_user(client, "dupeuser")
    headers = auth_headers(user)

    await client.post("/api/v1/squads", json={"name": "First"}, headers=headers)
    response = await client.post("/api/v1/squads", json={"name": "Second"}, headers=headers)
    assert response.status_code == 409
    assert response.json()["code"] == "ALREADY_IN_SQUAD"


@pytest.mark.asyncio
async def test_squad_full(client):
    leader = await register_user(client, "leader")
    leader_headers = auth_headers(leader)

    created = await client.post(
        "/api/v1/squads",
        json={"name": "Full Squad"},
        headers=leader_headers,
    )
    invite_code = created.json()["invite_code"]

    for i in range(4):
        member = await register_user(client, f"member{i}")
        join = await client.post(
            "/api/v1/squads/join",
            json={"invite_code": invite_code},
            headers=auth_headers(member),
        )
        assert join.status_code == 200

    extra = await register_user(client, "extrauser")
    full = await client.post(
        "/api/v1/squads/join",
        json={"invite_code": invite_code},
        headers=auth_headers(extra),
    )
    assert full.status_code == 409
    assert full.json()["code"] == "SQUAD_FULL"


@pytest.mark.asyncio
async def test_leaderboard_today_status(client, db_session):
    await client.post("/api/v1/internal/challenges/release", headers=internal_headers())
    creator = await register_user(client, "lbuser")
    headers = auth_headers(creator)

    created = await client.post(
        "/api/v1/squads",
        json={"name": "LB Squad"},
        headers=headers,
    )
    squad_id = created.json()["squad_id"]

    leaderboard = await client.get(
        f"/api/v1/squads/{squad_id}/leaderboard",
        headers=headers,
    )
    assert leaderboard.status_code == 200
    entry = leaderboard.json()["entries"][0]
    assert entry["today_status"] == "PENDING"
