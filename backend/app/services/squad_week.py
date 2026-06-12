import logging
from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    Challenge,
    Squad,
    SquadMembership,
    SquadMemberStatus,
    SquadWeek,
    SquadWeekResult,
    Submission,
    SubmissionStatus,
    User,
)
from app.services.streak import calculate_streak

logger = logging.getLogger("dailys.squad_week")


def monday_of_week(day: date) -> date:
    return day - timedelta(days=day.weekday())


def sunday_of_week(day: date) -> date:
    return monday_of_week(day) + timedelta(days=6)


async def ensure_current_week(db: AsyncSession, squad_id: UUID) -> SquadWeek:
    today = date.today()
    week_start = monday_of_week(today)
    week_end = sunday_of_week(today)

    result = await db.execute(
        select(SquadWeek).where(
            SquadWeek.squad_id == squad_id,
            SquadWeek.week_start == week_start,
        )
    )
    week = result.scalar_one_or_none()
    if week is not None:
        return week

    week = SquadWeek(squad_id=squad_id, week_start=week_start, week_end=week_end)
    db.add(week)
    await db.flush()
    return week


async def _count_weekly_successes(
    db: AsyncSession,
    user_id: UUID,
    week_start: date,
    week_end: date,
) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(Submission)
        .join(Challenge, Challenge.id == Submission.challenge_id)
        .where(
            Submission.user_id == user_id,
            Submission.status == SubmissionStatus.SUCCESS,
            func.date(Challenge.released_at) >= week_start,
            func.date(Challenge.released_at) <= week_end,
        )
    )
    return int(result.scalar_one())


async def close_week(db: AsyncSession, squad_id: UUID) -> UUID | None:
    result = await db.execute(
        select(SquadWeek)
        .where(SquadWeek.squad_id == squad_id)
        .order_by(SquadWeek.week_start.desc())
        .limit(1)
    )
    week = result.scalar_one_or_none()
    if week is None:
        week = await ensure_current_week(db, squad_id)

    members_result = await db.execute(
        select(SquadMembership, User)
        .join(User, User.id == SquadMembership.user_id)
        .where(
            SquadMembership.squad_id == squad_id,
            SquadMembership.status == SquadMemberStatus.ACTIVE,
        )
    )
    active_rows = members_result.all()
    if len(active_rows) <= 1:
        logger.info("Squad %s has %s active members; skipping elimination", squad_id, len(active_rows))
        return None

    scores: list[tuple[SquadMembership, User, int, int]] = []
    for membership, member in active_rows:
        weekly_successes = await _count_weekly_successes(db, member.id, week.week_start, week.week_end)
        streak = await calculate_streak(db, member.id)
        scores.append((membership, member, weekly_successes, streak))

    scores.sort(key=lambda row: (row[2], row[3], row[1].username))
    loser_membership, loser_user, _, _ = scores[0]

    loser_membership.status = SquadMemberStatus.ELIMINATED

    all_members = await db.execute(
        select(SquadMembership, User)
        .join(User, User.id == SquadMembership.user_id)
        .where(SquadMembership.squad_id == squad_id)
    )
    for membership, member in all_members.all():
        result_status = (
            SquadMemberStatus.ELIMINATED
            if member.id == loser_user.id
            else membership.status
        )
        db.add(
            SquadWeekResult(
                squad_week_id=week.id,
                user_id=member.id,
                status=result_status,
                missed_challenge_id=None,
            )
        )

    next_start = week.week_end + timedelta(days=1)
    next_end = next_start + timedelta(days=6)
    db.add(SquadWeek(squad_id=squad_id, week_start=next_start, week_end=next_end))

    await db.flush()
    return loser_user.id


async def close_all_squad_weeks(db: AsyncSession) -> list[tuple[UUID, UUID]]:
    squads_result = await db.execute(select(Squad))
    eliminations: list[tuple[UUID, UUID]] = []

    for squad in squads_result.scalars().all():
        await ensure_current_week(db, squad.id)
        eliminated_user_id = await close_week(db, squad.id)
        if eliminated_user_id is not None:
            eliminations.append((squad.id, eliminated_user_id))

    return eliminations
