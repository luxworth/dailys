import os

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://dailys:dailys@localhost:5432/dailys_test",
)


def internal_headers() -> dict[str, str]:
    return {"X-Internal-Key": os.environ.get("INTERNAL_API_KEY", "test-key")}


async def register_user(client, username: str, email: str | None = None, timezone_name: str = "UTC"):
    email = email or f"{username}@example.com"
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "username": username,
            "password": "password123",
            "timezone": timezone_name,
        },
    )
    assert response.status_code == 201
    return response.json()


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token['access_token']}"}


async def upload_test_image(client, user) -> str:
    response = await client.post(
        "/api/v1/uploads",
        files={"file": ("proof.jpg", b"fake-jpeg-bytes", "image/jpeg")},
        headers=auth_headers(user),
    )
    assert response.status_code == 201
    return response.json()["image_url"]


async def payload_for_task(client, user, task_type: str, **overrides) -> dict:
    if task_type == "NUMBER":
        return {"number_value": overrides.get("number_value", "42")}
    if task_type == "IMAGE":
        return {"image_url": overrides.get("image_url") or await upload_test_image(client, user)}
    return {"text_value": overrides.get("text_value", "hello")}
