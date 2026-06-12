"""Seed task templates from mobile tasks.ts data."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TaskTemplate
from app.models.enums import TaskType

TASK_TEMPLATES = [
    {
        "id": 1,
        "title": "Count the tiles in your bathroom",
        "task_type": TaskType.NUMBER,
        "placeholder": "Enter tile count",
        "verification_prompt": "Verify the submitted number is a plausible tile count for a bathroom (typically 20-500).",
    },
    {
        "id": 2,
        "title": "Take a photo of a dog",
        "task_type": TaskType.IMAGE,
        "placeholder": "Tap to capture or upload",
        "verification_prompt": "Verify the image contains a dog.",
    },
    {
        "id": 3,
        "title": "Upload a screenshot of your 10k steps",
        "task_type": TaskType.IMAGE,
        "placeholder": "Tap to upload screenshot",
        "verification_prompt": "Verify the screenshot shows step count at or above 10000.",
    },
    {
        "id": 4,
        "title": "Write one thing you are grateful for today",
        "task_type": TaskType.TEXT,
        "placeholder": "I am grateful for...",
        "verification_prompt": "Verify the text expresses gratitude in at least one complete thought.",
    },
    {
        "id": 5,
        "title": "Count how many red objects you can see right now",
        "task_type": TaskType.NUMBER,
        "placeholder": "Number of red objects",
        "verification_prompt": "Verify the number is a non-negative integer under 1000.",
    },
    {
        "id": 6,
        "title": "Snap a photo of something that made you smile",
        "task_type": TaskType.IMAGE,
        "placeholder": "Tap to capture or upload",
        "verification_prompt": "Verify the image appears to depict a positive or smile-inducing subject.",
    },
    {
        "id": 7,
        "title": "Describe the view from your nearest window in one sentence",
        "task_type": TaskType.TEXT,
        "placeholder": "The view looks like...",
        "verification_prompt": "Verify the text is a single sentence describing a view.",
    },
    {
        "id": 8,
        "title": "Do 20 jumping jacks and enter your heart rate",
        "task_type": TaskType.NUMBER,
        "placeholder": "Heart rate (bpm)",
        "verification_prompt": "Verify heart rate is a plausible bpm between 40 and 220.",
    },
    {
        "id": 9,
        "title": "Photograph your favorite mug",
        "task_type": TaskType.IMAGE,
        "placeholder": "Tap to capture or upload",
        "verification_prompt": "Verify the image contains a mug or cup.",
    },
    {
        "id": 10,
        "title": "Name three sounds you can hear right now",
        "task_type": TaskType.TEXT,
        "placeholder": "Sound 1, Sound 2, Sound 3",
        "verification_prompt": "Verify the text lists at least three distinct sounds.",
    },
]


async def seed_task_templates(db: AsyncSession) -> int:
    inserted = 0
    for row in TASK_TEMPLATES:
        existing = await db.execute(select(TaskTemplate).where(TaskTemplate.id == row["id"]))
        if existing.scalar_one_or_none() is not None:
            continue
        db.add(TaskTemplate(**row))
        inserted += 1
    await db.commit()
    return inserted
