from datetime import date, datetime, timedelta, timezone
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Challenge, Submission, SubmissionStatus, TaskTemplate, User, UserChallengeWindow
from app.schemas import HistoryDay, HistoryDayStatus, HistoryTraceEntry, UserHistoryResponse
from app.services.feed import _proof_preview
from app.services.streak import calculate_streak


def _window_local_date(opens_at: datetime, user_timezone: str) -> date:
    opens = opens_at if opens_at.tzinfo else opens_at.replace(tzinfo=timezone.utc)
    return opens.astimezone(ZoneInfo(user_timezone)).date()


def _derive_day_status(
    window: UserChallengeWindow | None,
    submission: Submission | None,
    now: datetime,
) -> HistoryDayStatus:
    if window is None:
        return HistoryDayStatus.NONE

    closes = window.closes_at if window.closes_at.tzinfo else window.closes_at.replace(tzinfo=timezone.utc)
    now_utc = now if now.tzinfo else now.replace(tzinfo=timezone.utc)

    if submission is not None and submission.status == SubmissionStatus.SUCCESS:
        submitted = (
            submission.submitted_at
            if submission.submitted_at.tzinfo
            else submission.submitted_at.replace(tzinfo=timezone.utc)
        )
        if submitted <= closes:
            return HistoryDayStatus.SUCCESS

    if now_utc > closes:
        return HistoryDayStatus.FAILED

    return HistoryDayStatus.PENDING


async def get_user_history(
    db: AsyncSession,
    user: User,
    days: int = 30,
    trace_limit: int = 10,
) -> UserHistoryResponse:
    tz = ZoneInfo(user.timezone)
    today_local = datetime.now(tz).date()
    start_date = today_local - timedelta(days=days - 1)
    date_range = [start_date + timedelta(days=i) for i in range(days)]

    windows_result = await db.execute(
        select(UserChallengeWindow, Challenge)
        .join(Challenge, Challenge.id == UserChallengeWindow.challenge_id)
        .where(UserChallengeWindow.user_id == user.id)
    )
    window_rows = windows_result.all()

    challenge_ids = [challenge.id for _, challenge in window_rows]
    submissions_by_challenge: dict[UUID, Submission] = {}
    if challenge_ids:
        submissions_result = await db.execute(
            select(Submission).where(
                Submission.user_id == user.id,
                Submission.challenge_id.in_(challenge_ids),
            )
        )
        for submission in submissions_result.scalars().all():
            submissions_by_challenge[submission.challenge_id] = submission

    status_by_date: dict[date, HistoryDayStatus] = {}
    now = datetime.now(timezone.utc)
    for window, challenge in window_rows:
        local_day = _window_local_date(window.opens_at, user.timezone)
        submission = submissions_by_challenge.get(challenge.id)
        status_by_date[local_day] = _derive_day_status(window, submission, now)

    history_days = [
        HistoryDay(date=day, status=status_by_date.get(day, HistoryDayStatus.NONE))
        for day in date_range
    ]

    trace_result = await db.execute(
        select(Submission, UserChallengeWindow, TaskTemplate)
        .join(Challenge, Challenge.id == Submission.challenge_id)
        .join(TaskTemplate, TaskTemplate.id == Challenge.task_template_id)
        .join(
            UserChallengeWindow,
            (UserChallengeWindow.challenge_id == Challenge.id)
            & (UserChallengeWindow.user_id == user.id),
        )
        .where(
            Submission.user_id == user.id,
            Submission.status == SubmissionStatus.SUCCESS,
        )
        .order_by(Submission.submitted_at.desc())
        .limit(trace_limit)
    )

    trace_entries: list[HistoryTraceEntry] = []
    for submission, window, template in trace_result.all():
        local_day = _window_local_date(window.opens_at, user.timezone)
        trace_entries.append(
            HistoryTraceEntry(
                date=local_day,
                task_type=template.task_type,
                title=template.title,
                submission_preview=_proof_preview(
                    {
                        "text_value": submission.text_value,
                        "number_value": submission.number_value,
                        "image_url": submission.image_url,
                        "is_ghost": submission.is_ghost,
                    }
                ),
            )
        )

    streak = await calculate_streak(db, user.id)
    return UserHistoryResponse(streak=streak, days=history_days, trace=trace_entries)
