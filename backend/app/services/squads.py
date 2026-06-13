import secrets
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Challenge,
    ChallengeStatus,
    Squad,
    SquadMembership,
    SquadMemberStatus,
    Submission,
    User,
)
from app.models.enums import SubmissionStatus
from app.schemas import (
    ErrorResponse,
    MySquadResponse,
    SquadCreatedResponse,
    SquadLeaderboardEntry,
    SquadLeaderboardResponse,
)
from app.services.streak import calculate_streak
from app.services.squad_week import ensure_current_week

MAX_SQUAD_MEMBERS = 5


async def _get_active_challenge(db: AsyncSession) -> Challenge | None:
    result = await db.execute(
        select(Challenge)
        .where(Challenge.status == ChallengeStatus.ACTIVE)
        .order_by(Challenge.released_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _get_today_status(
    db: AsyncSession,
    user_id: UUID,
    active_challenge: Challenge | None,
) -> SubmissionStatus | None:
    if active_challenge is None:
        return None

    result = await db.execute(
        select(Submission).where(
            Submission.user_id == user_id,
            Submission.challenge_id == active_challenge.id,
        )
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        return SubmissionStatus.PENDING
    return submission.status


async def _get_active_membership(db: AsyncSession, user_id: UUID) -> SquadMembership | None:
    result = await db.execute(
        select(SquadMembership).where(
            SquadMembership.user_id == user_id,
            SquadMembership.status == SquadMemberStatus.ACTIVE,
        )
    )
    return result.scalar_one_or_none()


async def create_squad(db: AsyncSession, user: User, name: str) -> SquadCreatedResponse:
    if await _get_active_membership(db, user.id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=ErrorResponse(
                code="ALREADY_IN_SQUAD",
                message="You are already in a squad.",
            ).model_dump(),
        )

    invite_code = secrets.token_urlsafe(8)
    squad = Squad(name=name.strip(), invite_code=invite_code)
    db.add(squad)
    await db.flush()

    db.add(SquadMembership(squad_id=squad.id, user_id=user.id))
    await ensure_current_week(db, squad.id)
    await db.commit()

    return SquadCreatedResponse(squad_id=squad.id, name=squad.name, invite_code=squad.invite_code)


async def join_squad(db: AsyncSession, user: User, invite_code: str) -> MySquadResponse:
    if await _get_active_membership(db, user.id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=ErrorResponse(
                code="ALREADY_IN_SQUAD",
                message="You are already in a squad.",
            ).model_dump(),
        )

    squad_result = await db.execute(select(Squad).where(Squad.invite_code == invite_code.strip()))
    squad = squad_result.scalar_one_or_none()
    if squad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse(
                code="INVALID_INVITE_CODE",
                message="Invalid invite code.",
            ).model_dump(),
        )

    count_result = await db.execute(
        select(func.count())
        .select_from(SquadMembership)
        .where(
            SquadMembership.squad_id == squad.id,
            SquadMembership.status == SquadMemberStatus.ACTIVE,
        )
    )
    member_count = int(count_result.scalar_one())
    if member_count >= MAX_SQUAD_MEMBERS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=ErrorResponse(code="SQUAD_FULL", message="This squad is full.").model_dump(),
        )

    db.add(SquadMembership(squad_id=squad.id, user_id=user.id))
    await db.commit()

    return MySquadResponse(
        squad_id=squad.id,
        name=squad.name,
        invite_code=squad.invite_code,
        member_count=member_count + 1,
        max_members=MAX_SQUAD_MEMBERS,
    )


async def leave_squad(db: AsyncSession, user: User) -> None:
    membership = await _get_active_membership(db, user.id)
    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse(
                code="NOT_IN_SQUAD",
                message="You are not in a squad.",
            ).model_dump(),
        )

    await db.delete(membership)
    await db.commit()


async def get_my_squad(db: AsyncSession, user: User) -> MySquadResponse | None:
    membership = await _get_active_membership(db, user.id)
    if membership is None:
        return None

    squad_result = await db.execute(select(Squad).where(Squad.id == membership.squad_id))
    squad = squad_result.scalar_one()

    count_result = await db.execute(
        select(func.count())
        .select_from(SquadMembership)
        .where(
            SquadMembership.squad_id == squad.id,
            SquadMembership.status == SquadMemberStatus.ACTIVE,
        )
    )
    member_count = int(count_result.scalar_one())

    return MySquadResponse(
        squad_id=squad.id,
        name=squad.name,
        invite_code=squad.invite_code,
        member_count=member_count,
        max_members=MAX_SQUAD_MEMBERS,
    )


async def get_squad_leaderboard(db: AsyncSession, squad_id: UUID) -> SquadLeaderboardResponse:
    squad_result = await db.execute(select(Squad).where(Squad.id == squad_id))
    squad = squad_result.scalar_one_or_none()
    if squad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorResponse(code="SQUAD_NOT_FOUND", message="Squad not found.").model_dump(),
        )

    week = await ensure_current_week(db, squad_id)
    await db.flush()

    members_result = await db.execute(
        select(SquadMembership, User)
        .join(User, User.id == SquadMembership.user_id)
        .where(SquadMembership.squad_id == squad_id)
        .order_by(SquadMembership.joined_at.asc())
    )
    rows = members_result.all()
    active_challenge = await _get_active_challenge(db)

    entries: list[SquadLeaderboardEntry] = []
    for membership, member in rows:
        streak = await calculate_streak(db, member.id)
        today_status = await _get_today_status(db, member.id, active_challenge)
        entries.append(
            SquadLeaderboardEntry(
                user_id=member.id,
                username=member.username,
                streak=streak,
                status=membership.status.value,
                today_status=today_status,
                rank=0,
            )
        )

    entries.sort(key=lambda e: (-e.streak, e.username))
    ranked = [
        SquadLeaderboardEntry(
            user_id=entry.user_id,
            username=entry.username,
            streak=entry.streak,
            status=entry.status,
            today_status=entry.today_status,
            rank=idx,
        )
        for idx, entry in enumerate(entries, start=1)
    ]

    return SquadLeaderboardResponse(
        squad_id=squad_id,
        week_start=week.week_start if week else None,
        week_end=week.week_end if week else None,
        entries=ranked,
    )
