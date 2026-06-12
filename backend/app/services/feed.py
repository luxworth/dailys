from datetime import datetime
from pathlib import Path
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ReactionType
from app.schemas import FeedItem, FeedPage, ReactionCounts

QUERIES_DIR = Path(__file__).resolve().parent.parent / "queries"
CURSOR_FILTER = """    AND (
        :cursor_submitted_at IS NULL
        OR s.submitted_at < CAST(:cursor_submitted_at AS timestamptz)
    )
"""


def _proof_preview(row: dict) -> str:
    if row.get("text_value"):
        return str(row["text_value"])
    if row.get("number_value") is not None:
        return str(row["number_value"])
    if row.get("image_url"):
        return "[Image]"
    if row.get("is_ghost"):
        return "[Ghost]"
    return "—"


async def fetch_feed_page(
    db: AsyncSession,
    user_id: UUID,
    limit: int = 20,
    cursor: str | None = None,
) -> FeedPage:
    sql = (QUERIES_DIR / "feed.sql").read_text()
    params: dict = {"user_id": str(user_id), "limit": limit + 1}
    if cursor:
        params["cursor_submitted_at"] = datetime.fromisoformat(cursor)
    else:
        sql = sql.replace(CURSOR_FILTER, "")

    result = await db.execute(text(sql), params)
    rows = [dict(r._mapping) for r in result.fetchall()]

    next_cursor = None
    if len(rows) > limit:
        rows = rows[:limit]
        next_cursor = rows[-1]["submitted_at"].isoformat()

    items = [
        FeedItem(
            id=row["id"],
            username=row["username"],
            proof_preview=_proof_preview(row),
            submitted_at=row["submitted_at"],
            reactions=ReactionCounts(
                mind_blown=int(row["mind_blown"] or 0),
                laugh=int(row["laugh"] or 0),
                respect=int(row["respect"] or 0),
            ),
            viewer_reaction=ReactionType(row["viewer_reaction"]) if row.get("viewer_reaction") else None,
        )
        for row in rows
    ]
    return FeedPage(items=items, next_cursor=next_cursor)
