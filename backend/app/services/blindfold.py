from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Challenge, ChallengeStatus, Submission, SubmissionStatus, User
from app.schemas import ErrorResponse
from fastapi import HTTPException, status


async def get_active_challenge(db: AsyncSession) -> Challenge | None:
    result = await db.execute(
        select(Challenge)
        .where(Challenge.status == ChallengeStatus.ACTIVE)
        .order_by(Challenge.released_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def caller_has_success_on_active(db: AsyncSession, user_id: UUID) -> bool:
    result = await db.execute(
        text(
            """
            SELECT EXISTS (
                SELECT 1
                FROM submissions s
                JOIN challenges c ON c.id = s.challenge_id
                WHERE c.status = 'ACTIVE'
                  AND s.user_id = :user_id
                  AND s.status = 'SUCCESS'
            )
            """
        ),
        {"user_id": str(user_id)},
    )
    return bool(result.scalar())


async def assert_can_view_feed(db: AsyncSession, user_id: UUID) -> None:
    if not await caller_has_success_on_active(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorResponse(
                code="FEED_BLINDFOLDED",
                message="Submit today's proof before viewing the global feed.",
            ).model_dump(),
        )


def assert_window_open(closes_at: datetime) -> None:
    now = datetime.now(timezone.utc)
    closes = closes_at if closes_at.tzinfo else closes_at.replace(tzinfo=timezone.utc)
    if now > closes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorResponse(
                code="WINDOW_CLOSED",
                message="Submission window has closed for this challenge.",
            ).model_dump(),
        )
