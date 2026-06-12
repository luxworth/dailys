from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Challenge, TaskTemplate, User, UserChallengeWindow


def compute_closes_at(released_at: datetime, user_timezone: str) -> datetime:
    released = released_at if released_at.tzinfo else released_at.replace(tzinfo=timezone.utc)
    tz = ZoneInfo(user_timezone)
    local = released.astimezone(tz)
    local_day_start = local.replace(hour=0, minute=0, second=0, microsecond=0)
    next_midnight = local_day_start + timedelta(days=1)
    return next_midnight.astimezone(timezone.utc)


async def ensure_user_window(
    db: AsyncSession,
    user: User,
    challenge: Challenge,
) -> UserChallengeWindow:
    result = await db.execute(
        select(UserChallengeWindow).where(
            UserChallengeWindow.user_id == user.id,
            UserChallengeWindow.challenge_id == challenge.id,
        )
    )
    window = result.scalar_one_or_none()
    if window is not None:
        return window

    opens_at = challenge.released_at
    if opens_at.tzinfo is None:
        opens_at = opens_at.replace(tzinfo=timezone.utc)
    closes_at = compute_closes_at(opens_at, user.timezone)
    window = UserChallengeWindow(
        user_id=user.id,
        challenge_id=challenge.id,
        opens_at=opens_at,
        closes_at=closes_at,
    )
    db.add(window)
    await db.flush()
    return window


async def get_active_challenge(db: AsyncSession) -> Challenge | None:
    from app.models import ChallengeStatus

    result = await db.execute(
        select(Challenge)
        .where(Challenge.status == ChallengeStatus.ACTIVE)
        .order_by(Challenge.released_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


def pick_task_template_id(sequence_number: int, template_count: int) -> int:
    return ((sequence_number - 1) % template_count) + 1


async def release_next_challenge(db: AsyncSession) -> Challenge:
    from app.models import ChallengeStatus

    templates = (await db.execute(select(TaskTemplate).order_by(TaskTemplate.id))).scalars().all()
    if not templates:
        raise ValueError("No task templates seeded")

    active_result = await db.execute(
        select(Challenge)
        .where(Challenge.status == ChallengeStatus.ACTIVE)
        .with_for_update()
    )
    active = active_result.scalar_one_or_none()
    if active is not None:
        active.status = ChallengeStatus.CLOSED

    last_seq_result = await db.execute(text("SELECT COALESCE(MAX(sequence_number), 0) FROM challenges"))
    next_seq = int(last_seq_result.scalar_one()) + 1
    template = templates[(next_seq - 1) % len(templates)]

    challenge = Challenge(
        sequence_number=next_seq,
        task_template_id=template.id,
        released_at=datetime.now(timezone.utc),
        status=ChallengeStatus.ACTIVE,
    )
    db.add(challenge)
    await db.flush()
    return challenge
