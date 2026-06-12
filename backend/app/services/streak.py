from pathlib import Path
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

QUERIES_DIR = Path(__file__).resolve().parent.parent / "queries"


def _load_sql(name: str) -> str:
    return (QUERIES_DIR / name).read_text()


async def calculate_streak(db: AsyncSession, user_id: UUID) -> int:
    sql = _load_sql("streak.sql")
    result = await db.execute(text(sql), {"user_id": str(user_id)})
    return int(result.scalar_one() or 0)


async def calculate_percentile(db: AsyncSession, user_id: UUID) -> float | None:
    sql = _load_sql("percentile.sql")
    result = await db.execute(text(sql), {"user_id": str(user_id)})
    value = result.scalar_one_or_none()
    return float(value) if value is not None else None
