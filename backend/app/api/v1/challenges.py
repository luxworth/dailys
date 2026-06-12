from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.db.session import get_async_session
from app.models import Submission, TaskTemplate, User
from app.schemas import ChallengeTodayResponse, FeedPage, SubmissionSummary, TaskInfo
from app.services.blindfold import assert_can_view_feed
from app.services.challenge_release import ensure_user_window, get_active_challenge
from app.services.feed import fetch_feed_page

router = APIRouter(prefix="/challenges", tags=["challenges"])


@router.get("/today", response_model=ChallengeTodayResponse)
async def get_today_challenge(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> ChallengeTodayResponse:
    challenge = await get_active_challenge(db)
    if challenge is None:
        from fastapi import HTTPException, status
        from app.schemas import ErrorResponse

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse(code="NO_ACTIVE_CHALLENGE", message="No active challenge released.").model_dump(),
        )

    window = await ensure_user_window(db, user, challenge)
    await db.commit()

    template_result = await db.execute(select(TaskTemplate).where(TaskTemplate.id == challenge.task_template_id))
    template = template_result.scalar_one()

    sub_result = await db.execute(
        select(Submission).where(Submission.user_id == user.id, Submission.challenge_id == challenge.id)
    )
    submission = sub_result.scalar_one_or_none()

    return ChallengeTodayResponse(
        challenge_id=challenge.id,
        sequence_number=challenge.sequence_number,
        released_at=challenge.released_at,
        closes_at=window.closes_at,
        task=TaskInfo(
            task_type=template.task_type,
            title=template.title,
            placeholder=template.placeholder,
        ),
        submission=(
            SubmissionSummary(
                id=submission.id,
                status=submission.status,
                is_ghost=submission.is_ghost,
                submitted_at=submission.submitted_at,
                number_value=submission.number_value,
                text_value=submission.text_value,
                image_url=submission.image_url,
            )
            if submission
            else None
        ),
    )


@router.get("/today/feed", response_model=FeedPage)
async def get_today_feed(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    limit: int = Query(20, le=50),
    cursor: str | None = None,
) -> FeedPage:
    await assert_can_view_feed(db, user.id)
    return await fetch_feed_page(db, user.id, limit, cursor)
