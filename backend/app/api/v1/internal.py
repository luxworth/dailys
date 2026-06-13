from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies import require_internal_key
from app.db.session import get_async_session
from app.models import Challenge, Squad
from app.schemas import (
    ChallengeTodayResponse,
    CloseWeekResponse,
    EliminationSummary,
    ErrorResponse,
    TaskInfo,
)
from app.services.challenge_release import release_next_challenge
from app.services.squad_week import close_all_squad_weeks

router = APIRouter(prefix="/internal", tags=["internal"])


@router.post("/challenges/release", response_model=ChallengeTodayResponse)
async def internal_release_challenge(
    db: AsyncSession = Depends(get_async_session),
    _: None = Depends(require_internal_key),
) -> ChallengeTodayResponse:
    try:
        challenge = await release_next_challenge(db)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=ErrorResponse(
                code="NO_TASK_TEMPLATES",
                message=str(exc) if str(exc) else "Task templates are not seeded.",
            ).model_dump(),
        ) from exc
    await db.commit()

    result = await db.execute(
        select(Challenge)
        .options(selectinload(Challenge.task_template))
        .where(Challenge.id == challenge.id)
    )
    challenge = result.scalar_one()
    template = challenge.task_template
    return ChallengeTodayResponse(
        challenge_id=challenge.id,
        sequence_number=challenge.sequence_number,
        released_at=challenge.released_at,
        closes_at=challenge.released_at,
        task=TaskInfo(
            task_type=template.task_type,
            title=template.title,
            placeholder=template.placeholder,
        ),
        submission=None,
    )


@router.post("/squads/close-week", response_model=CloseWeekResponse)
async def internal_close_squad_week(
    db: AsyncSession = Depends(get_async_session),
    _: None = Depends(require_internal_key),
) -> CloseWeekResponse:
    squads_result = await db.execute(select(Squad))
    squad_count = len(squads_result.scalars().all())

    eliminations_raw = await close_all_squad_weeks(db)
    await db.commit()

    return CloseWeekResponse(
        squads_processed=squad_count,
        eliminations=[
            EliminationSummary(squad_id=squad_id, user_id=user_id)
            for squad_id, user_id in eliminations_raw
        ],
    )
