import httpx

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


async def send_expo_push(
    token: str,
    *,
    title: str,
    body: str,
    data: dict | None = None,
) -> bool:
    payload = {
        "to": token,
        "title": title,
        "body": body,
        "sound": "default",
        "data": data or {},
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            EXPO_PUSH_URL,
            json=payload,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
        result = response.json()
        ticket = result.get("data")
        if isinstance(ticket, dict):
            return ticket.get("status") == "ok"
        if isinstance(ticket, list) and ticket:
            return ticket[0].get("status") == "ok"
        return False
