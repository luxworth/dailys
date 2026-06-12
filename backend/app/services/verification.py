import asyncio
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.session import async_session_factory
from app.models import Challenge, Submission, SubmissionStatus, TaskTemplate
from app.services.verification_providers.factory import get_verification_provider

settings = get_settings()
logger = logging.getLogger("dailys.verification")


async def _mark_submission_failed(db: AsyncSession, submission_id: UUID, error_message: str) -> None:
    sub_result = await db.execute(select(Submission).where(Submission.id == submission_id))
    submission = sub_result.scalar_one_or_none()
    if submission is None or submission.status != SubmissionStatus.PENDING:
        return

    submission.status = SubmissionStatus.FAILED
    submission.ai_verdict = {"error": error_message, "mode": "verification_error"}
    submission.verified_at = datetime.now(timezone.utc)
    await db.commit()


async def verify_submission_with_session(db: AsyncSession, submission_id: UUID) -> None:
    sub_result = await db.execute(select(Submission).where(Submission.id == submission_id))
    submission = sub_result.scalar_one_or_none()
    if submission is None or submission.status != SubmissionStatus.PENDING:
        return

    challenge_result = await db.execute(select(Challenge).where(Challenge.id == submission.challenge_id))
    challenge = challenge_result.scalar_one()
    template_result = await db.execute(
        select(TaskTemplate).where(TaskTemplate.id == challenge.task_template_id)
    )
    template = template_result.scalar_one()

    provider = get_verification_provider()
    new_status, verdict = await provider.verify(
        template.task_type,
        template.verification_prompt,
        submission.number_value,
        submission.text_value,
        submission.image_url,
    )
    submission.status = new_status
    submission.ai_verdict = verdict
    submission.verified_at = datetime.now(timezone.utc)
    await db.commit()


async def verify_submission(submission_id: UUID) -> None:
    last_error: Exception | None = None
    for attempt in range(2):
        try:
            async with async_session_factory() as db:
                await verify_submission_with_session(db, submission_id)
            return
        except Exception as exc:
            last_error = exc
            if attempt == 0:
                logger.warning(
                    "Verification transient failure for submission %s, retrying: %s",
                    submission_id,
                    exc,
                )
                await asyncio.sleep(2)
                continue

    logger.error(
        "Verification failed permanently for submission %s: %s",
        submission_id,
        last_error,
    )
    async with async_session_factory() as db:
        await _mark_submission_failed(db, submission_id, str(last_error))
