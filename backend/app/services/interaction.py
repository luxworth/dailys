from app.models.enums import AudioType, HapticType, SubmissionStatus, TaskType
from app.schemas import InteractionMeta

MILESTONE_STREAK_7 = "STREAK_7"
MILESTONE_STREAK_30 = "STREAK_30"


def build_submission_interaction(
    task_type: TaskType,
    status: SubmissionStatus,
    streak_before: int,
    streak_after: int,
) -> InteractionMeta:
    if status == SubmissionStatus.FAILED:
        return InteractionMeta(
            haptic=HapticType.FAILURE_BUZZ,
            audio=AudioType.ERROR_DULL,
        )

    if status == SubmissionStatus.PENDING:
        return build_pending_interaction()

    if streak_before < 30 <= streak_after:
        return InteractionMeta(
            haptic=HapticType.SUCCESS_CHIME,
            audio=AudioType.PLASMA_IGNITION,
            milestone=MILESTONE_STREAK_30,
        )

    if streak_before < 7 <= streak_after:
        return InteractionMeta(
            haptic=HapticType.SUCCESS_CHIME,
            audio=AudioType.ORCHESTRA_CRESCENDO,
            milestone=MILESTONE_STREAK_7,
        )

    if task_type == TaskType.NUMBER:
        return InteractionMeta(
            haptic=HapticType.MEDIUM,
            audio=AudioType.CALCULATOR_CLICK,
        )

    return InteractionMeta(
        haptic=HapticType.MEDIUM,
        audio=AudioType.MATCH_STRIKE,
    )


def build_ghost_deploy_interaction() -> InteractionMeta:
    return InteractionMeta(
        haptic=HapticType.LIGHT,
        audio=AudioType.MATCH_STRIKE,
    )


def build_elimination_interaction() -> InteractionMeta:
    return InteractionMeta(
        haptic=HapticType.FAILURE_BUZZ,
        audio=AudioType.ERROR_DULL,
    )


def build_pending_interaction() -> InteractionMeta:
    return InteractionMeta(
        haptic=HapticType.LIGHT,
        audio=None,
        intensity=0.5,
    )
