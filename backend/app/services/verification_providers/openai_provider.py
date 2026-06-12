import logging

from app.models.enums import SubmissionStatus, TaskType

logger = logging.getLogger("dailys.verification.openai")


class OpenAIProvider:
    """Structured shell for future OpenAI vision/text verification."""

    def __init__(self, api_key: str, model: str) -> None:
        self._api_key = api_key
        self._model = model

    async def verify(
        self,
        task_type: TaskType,
        verification_prompt: str,
        number_value,
        text_value: str | None,
        image_url: str | None,
    ) -> tuple[SubmissionStatus, dict]:
        logger.warning(
            "OpenAI verification not fully implemented; auto-accepting submission (model=%s)",
            self._model,
        )
        return SubmissionStatus.SUCCESS, {
            "mode": "openai_shell",
            "passed": True,
            "model": self._model,
            "prompt": verification_prompt,
            "task_type": task_type.value,
        }
