from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.services.blindfold import assert_can_view_feed
from app.db.session import get_async_session
from app.models import Reaction, Submission, User
from app.schemas import ErrorResponse, ReactionCreate, ReactionResponse

router = APIRouter(tags=["reactions"])


@router.put("/submissions/{submission_id}/reaction", response_model=ReactionResponse)
async def upsert_reaction(
    submission_id: UUID,
    body: ReactionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> ReactionResponse:
    sub_result = await db.execute(select(Submission).where(Submission.id == submission_id))
    submission = sub_result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse(code="SUBMISSION_NOT_FOUND", message="Submission not found.").model_dump(),
        )

    await assert_can_view_feed(db, user.id)

    result = await db.execute(
        select(Reaction).where(Reaction.user_id == user.id, Reaction.submission_id == submission_id)
    )
    reaction = result.scalar_one_or_none()
    if reaction is None:
        reaction = Reaction(user_id=user.id, submission_id=submission_id, reaction_type=body.reaction_type)
        db.add(reaction)
    else:
        reaction.reaction_type = body.reaction_type

    await db.commit()
    return ReactionResponse(submission_id=submission_id, reaction_type=reaction.reaction_type)


@router.delete("/submissions/{submission_id}/reaction", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reaction(
    submission_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> None:
    sub_result = await db.execute(select(Submission).where(Submission.id == submission_id))
    submission = sub_result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse(code="SUBMISSION_NOT_FOUND", message="Submission not found.").model_dump(),
        )

    await assert_can_view_feed(db, user.id)

    await db.execute(
        delete(Reaction).where(Reaction.user_id == user.id, Reaction.submission_id == submission_id)
    )
    await db.commit()
