from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Challenge,
    ChallengeStatus,
    SquadMembership,
    SquadMemberStatus,
    SquadNudge,
    Submission,
    SubmissionStatus,
    User,
)
from app.schemas import ErrorResponse, SquadNudgeResponse
from app.services.push import send_expo_push
from app.services.squads import _get_active_challenge, _get_active_membership


async def update_push_token(db: AsyncSession, user: User, token: str) -> None:
    user.expo_push_token = token.strip()
    await db.commit()


async def _members_share_active_squad(
    db: AsyncSession,
    user_a_id: UUID,
    user_b_id: UUID,
) -> UUID | None:
    result = await db.execute(
        select(SquadMembership.squad_id)
        .where(
            SquadMembership.user_id == user_a_id,
            SquadMembership.status == SquadMemberStatus.ACTIVE,
        )
    )
    squad_ids_a = {row[0] for row in result.all()}
    if not squad_ids_a:
        return None

    result = await db.execute(
        select(SquadMembership.squad_id)
        .where(
            SquadMembership.user_id == user_b_id,
            SquadMembership.status == SquadMemberStatus.ACTIVE,
            SquadMembership.squad_id.in_(squad_ids_a),
        )
        .limit(1)
    )
    row = result.first()
    return row[0] if row else None


async def _recipient_can_be_nudged(
    db: AsyncSession,
    recipient_id: UUID,
    challenge: Challenge,
) -> bool:
    result = await db.execute(
        select(Submission).where(
            Submission.user_id == recipient_id,
            Submission.challenge_id == challenge.id,
        )
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        return True
    return submission.status != SubmissionStatus.SUCCESS


async def send_squad_nudge(
    db: AsyncSession,
    sender: User,
    squad_id: UUID,
    recipient_id: UUID,
) -> SquadNudgeResponse:
    if sender.id == recipient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=ErrorResponse(
                code="CANNOT_NUDGE_SELF",
                message="You cannot nudge yourself.",
            ).model_dump(),
        )

    sender_membership = await _get_active_membership(db, sender.id)
    if sender_membership is None or sender_membership.squad_id != squad_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorResponse(
                code="NOT_IN_SQUAD",
                message="You are not in this squad.",
            ).model_dump(),
        )

    recipient_result = await db.execute(select(User).where(User.id == recipient_id))
    recipient = recipient_result.scalar_one_or_none()
    if recipient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse(
                code="USER_NOT_FOUND",
                message="Teammate not found.",
            ).model_dump(),
        )

    shared_squad = await _members_share_active_squad(db, sender.id, recipient_id)
    if shared_squad != squad_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=ErrorResponse(
                code="NOT_SQUAD_MEMBER",
                message="That user is not an active member of your squad.",
            ).model_dump(),
        )

    recipient_membership = await _get_active_membership(db, recipient_id)
    if recipient_membership is None or recipient_membership.status != SquadMemberStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=ErrorResponse(
                code="MEMBER_INACTIVE",
                message="That teammate is no longer active in the squad.",
            ).model_dump(),
        )

    active_challenge = await _get_active_challenge(db)
    if active_challenge is None or active_challenge.status != ChallengeStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=ErrorResponse(
                code="NO_ACTIVE_CHALLENGE",
                message="There is no active challenge to nudge for.",
            ).model_dump(),
        )

    if not await _recipient_can_be_nudged(db, recipient_id, active_challenge):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=ErrorResponse(
                code="ALREADY_SUBMITTED",
                message="That teammate has already submitted today.",
            ).model_dump(),
        )

    nudge = SquadNudge(
        sender_id=sender.id,
        recipient_id=recipient_id,
        challenge_id=active_challenge.id,
    )

    existing = await db.execute(
        select(SquadNudge.id).where(
            SquadNudge.sender_id == sender.id,
            SquadNudge.recipient_id == recipient_id,
            SquadNudge.challenge_id == active_challenge.id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=ErrorResponse(
                code="ALREADY_NUDGED",
                message="You already nudged this teammate today.",
            ).model_dump(),
        )

    db.add(nudge)
    await db.flush()

    delivered = False
    if recipient.expo_push_token:
        delivered = await send_expo_push(
            recipient.expo_push_token,
            title="Squad nudge",
            body=f"{sender.username} nudged you — submit today's proof.",
            data={"type": "squad_nudge", "squad_id": str(squad_id)},
        )

    await db.commit()
    return SquadNudgeResponse(delivered=delivered)
