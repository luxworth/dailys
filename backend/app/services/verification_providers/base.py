from typing import Protocol

from app.models.enums import SubmissionStatus, TaskType


class VerificationProvider(Protocol):
    async def verify(
        self,
        task_type: TaskType,
        verification_prompt: str,
        number_value,
        text_value: str | None,
        image_url: str | None,
    ) -> tuple[SubmissionStatus, dict]:
        ...
