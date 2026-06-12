from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    ItemType,
    Submission,
    SubmissionStatus,
    UserChallengeWindow,
    UserItem,
)
from app.schemas import ErrorResponse, GhostDeployResponse


async def deploy_ghost(
    db: AsyncSession,
    user_id: UUID,
    challenge_id: UUID,
) -> GhostDeployResponse:
    item_result = await db.execute(
        select(UserItem)
        .where(UserItem.user_id == user_id, UserItem.item_type == ItemType.GHOST)
        .with_for_update()
    )
    item = item_result.scalar_one_or_none()
    if item is None or item.quantity <= 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=ErrorResponse(code="NO_GHOST_STOCK", message="No ghost tokens remaining.").model_dump(),
        )

    window_result = await db.execute(
        select(UserChallengeWindow).where(
            UserChallengeWindow.user_id == user_id,
            UserChallengeWindow.challenge_id == challenge_id,
        )
    )
    window = window_result.scalar_one_or_none()
    if window is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse(code="CHALLENGE_NOT_FOUND", message="Challenge window not found.").model_dump(),
        )

    now = datetime.now(timezone.utc)
    closes = window.closes_at if window.closes_at.tzinfo else window.closes_at.replace(tzinfo=timezone.utc)
    if now <= closes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorResponse(
                code="WINDOW_OPEN",
                message="Ghost mode can only be deployed after the window closes.",
            ).model_dump(),
        )

    sub_result = await db.execute(
        select(Submission).where(
            Submission.user_id == user_id,
            Submission.challenge_id == challenge_id,
        )
    )
    submission = sub_result.scalar_one_or_none()
    if submission is not None and submission.status == SubmissionStatus.SUCCESS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=ErrorResponse(code="ALREADY_SUBMITTED", message="Challenge already completed.").model_dump(),
        )

    item.quantity -= 1
    if submission is None:
        submission = Submission(
            user_id=user_id,
            challenge_id=challenge_id,
            status=SubmissionStatus.SUCCESS,
            is_ghost=True,
            text_value="[GHOST MODE DEPLOYED]",
            submitted_at=now,
            verified_at=now,
        )
        db.add(submission)
    else:
        submission.status = SubmissionStatus.SUCCESS
        submission.is_ghost = True
        submission.text_value = "[GHOST MODE DEPLOYED]"
        submission.submitted_at = now
        submission.verified_at = now

    await db.flush()
    return GhostDeployResponse(
        submission_id=submission.id,
        challenge_id=challenge_id,
        ghosts_remaining=item.quantity,
    )
