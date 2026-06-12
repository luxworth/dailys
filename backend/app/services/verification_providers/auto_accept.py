from app.models.enums import SubmissionStatus, TaskType


class AutoAcceptProvider:
    async def verify(
        self,
        task_type: TaskType,
        verification_prompt: str,
        number_value,
        text_value: str | None,
        image_url: str | None,
    ) -> tuple[SubmissionStatus, dict]:
        return SubmissionStatus.SUCCESS, {
            "mode": "auto_accept",
            "passed": True,
            "task_type": task_type.value,
        }
