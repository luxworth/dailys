from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status

from sqlalchemy import select

from sqlalchemy.exc import IntegrityError

from sqlalchemy.ext.asyncio import AsyncSession



from app.config import get_settings

from app.dependencies import get_current_user

from app.db.session import get_async_session

from app.models import Submission, SubmissionStatus, TaskTemplate, User

from app.models.enums import TaskType

from app.schemas import (

    ErrorResponse,

    InteractionMeta,

    SubmissionCreate,

    SubmissionResponse,

    SubmissionTransactionalResponse,

)

from app.services.blindfold import assert_window_open

from app.services.challenge_release import ensure_user_window, get_active_challenge

from app.services.interaction import build_pending_interaction, build_submission_interaction

from app.services.streak import calculate_streak

from app.services.storage import validate_owned_image_url

from app.services.verification import verify_submission, verify_submission_with_session



router = APIRouter(prefix="/submissions", tags=["submissions"])

settings = get_settings()





def _validate_payload(task_type: TaskType, body: SubmissionCreate, user_id) -> None:

    if task_type == TaskType.NUMBER:

        if body.number_value is None:

            raise HTTPException(

                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,

                detail=ErrorResponse(code="INVALID_PAYLOAD", message="number_value is required.").model_dump(),

            )

        if body.text_value or body.image_url:

            raise HTTPException(

                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,

                detail=ErrorResponse(code="INVALID_PAYLOAD", message="Only number_value allowed.").model_dump(),

            )

    elif task_type == TaskType.TEXT:

        if not body.text_value:

            raise HTTPException(

                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,

                detail=ErrorResponse(code="INVALID_PAYLOAD", message="text_value is required.").model_dump(),

            )

        if body.number_value is not None or body.image_url:

            raise HTTPException(

                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,

                detail=ErrorResponse(code="INVALID_PAYLOAD", message="Only text_value allowed.").model_dump(),

            )

    elif task_type == TaskType.IMAGE:

        if not body.image_url:

            raise HTTPException(

                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,

                detail=ErrorResponse(code="INVALID_PAYLOAD", message="image_url is required.").model_dump(),

            )

        if body.number_value is not None or body.text_value:

            raise HTTPException(

                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,

                detail=ErrorResponse(code="INVALID_PAYLOAD", message="Only image_url allowed.").model_dump(),

            )

        try:

            validate_owned_image_url(body.image_url, user_id, settings)

        except ValueError as exc:

            raise HTTPException(

                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,

                detail=ErrorResponse(code="INVALID_IMAGE_URL", message=str(exc)).model_dump(),

            ) from exc





@router.post("", response_model=SubmissionTransactionalResponse, status_code=status.HTTP_201_CREATED)

async def create_submission(

    body: SubmissionCreate,

    background_tasks: BackgroundTasks,

    user: User = Depends(get_current_user),

    db: AsyncSession = Depends(get_async_session),

) -> SubmissionTransactionalResponse:

    challenge = await get_active_challenge(db)

    if challenge is None:

        raise HTTPException(

            status_code=status.HTTP_404_NOT_FOUND,

            detail=ErrorResponse(code="NO_ACTIVE_CHALLENGE", message="No active challenge.").model_dump(),

        )



    window = await ensure_user_window(db, user, challenge)

    assert_window_open(window.closes_at)



    template_result = await db.execute(select(TaskTemplate).where(TaskTemplate.id == challenge.task_template_id))

    template = template_result.scalar_one()

    _validate_payload(template.task_type, body, user.id)



    existing = await db.execute(

        select(Submission).where(Submission.user_id == user.id, Submission.challenge_id == challenge.id)

    )

    if existing.scalar_one_or_none() is not None:

        raise HTTPException(

            status_code=status.HTTP_409_CONFLICT,

            detail=ErrorResponse(code="ALREADY_SUBMITTED", message="Already submitted for this challenge.").model_dump(),

        )



    streak_before = await calculate_streak(db, user.id)



    submission = Submission(

        user_id=user.id,

        challenge_id=challenge.id,

        status=SubmissionStatus.PENDING,

        number_value=body.number_value,

        text_value=body.text_value,

        image_url=body.image_url,

    )

    db.add(submission)

    try:

        await db.commit()

    except IntegrityError:

        await db.rollback()

        raise HTTPException(

            status_code=status.HTTP_409_CONFLICT,

            detail=ErrorResponse(code="ALREADY_SUBMITTED", message="Already submitted for this challenge.").model_dump(),

        ) from None



    await db.refresh(submission)



    if settings.ai_verification_enabled:

        background_tasks.add_task(verify_submission, submission.id)

        interaction: InteractionMeta = build_pending_interaction()

    else:

        await verify_submission_with_session(db, submission.id)
        await db.refresh(submission)

        streak_after = await calculate_streak(db, user.id)

        interaction = build_submission_interaction(

            template.task_type,

            submission.status,

            streak_before,

            streak_after,

        )



    return SubmissionTransactionalResponse(

        data=SubmissionResponse.model_validate(submission),

        interaction=interaction,

    )


