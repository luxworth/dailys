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
    {
        "id": 11,
        "title": "Count the pillows on your bed",
        "task_type": TaskType.NUMBER,
        "placeholder": "Enter number of pillows",
        "verification_prompt": "Verify the submission is a plausible count of bed pillows, strictly between 0 and 15.",
    },
    {
        "id": 12,
        "title": "Snap a photo of your current footwear",
        "task_type": TaskType.IMAGE,
        "placeholder": "Tap to capture or upload",
        "verification_prompt": "Verify the image clearly shows a pair of shoes, socks, slippers, or bare feet.",
    },
    {
        "id": 13,
        "title": "Write down your top goal for today",
        "task_type": TaskType.TEXT,
        "placeholder": "Today I want to accomplish...",
        "verification_prompt": "Verify the text contains a coherent, meaningful sentence structure outlining a daily task or intention.",
    },
    {
        "id": 14,
        "title": "Check your phone battery percentage",
        "task_type": TaskType.NUMBER,
        "placeholder": "Enter percentage (0-100)",
        "verification_prompt": "Verify the submission is a valid percentage value between 1 and 100.",
    },
    {
        "id": 15,
        "title": "Photograph a green leaf or indoor plant",
        "task_type": TaskType.IMAGE,
        "placeholder": "Tap to capture or upload",
        "verification_prompt": "Verify the image contains visible green foliage, a houseplant, or outdoor shrubbery.",
    },
    {
        "id": 16,
        "title": "Describe the pattern on your blanket or rug",
        "task_type": TaskType.TEXT,
        "placeholder": "Stripes, solid color, floral...",
        "verification_prompt": "Verify the text is a descriptive phrase or sentence explaining a visual pattern or fabric design.",
    },
    {
        "id": 17,
        "title": "Count the windows in your current room",
        "task_type": TaskType.NUMBER,
        "placeholder": "Enter number of windows",
        "verification_prompt": "Verify the submission is a realistic count of windows in a single room, between 0 and 10.",
    },
    {
        "id": 18,
        "title": "Take a photo of a physical book cover",
        "task_type": TaskType.IMAGE,
        "placeholder": "Tap to capture or upload",
        "verification_prompt": "Verify the image clearly displays the front cover or spine of a printed book.",
    },
    {
        "id": 19,
        "title": "List two things you appreciate about your home",
        "task_type": TaskType.TEXT,
        "placeholder": "1. Comfortable bed, 2. Big kitchen...",
        "verification_prompt": "Verify the text contains a legible list or sentence highlighting exactly two positive aspects of their living space.",
    },
    {
        "id": 20,
        "title": "Count the visible keys on your keychain",
        "task_type": TaskType.NUMBER,
        "placeholder": "Enter number of keys",
        "verification_prompt": "Verify the submission is a plausible number of keys on a single ring, between 0 and 20.",
    },
    {
        "id": 21,
        "title": "Photograph your main workspace or desk setup",
        "task_type": TaskType.IMAGE,
        "placeholder": "Tap to capture or upload",
        "verification_prompt": "Verify the image shows a desk, table, computer setup, or dedicated working area.",
    },
    {
        "id": 22,
        "title": "Write a sentence using a word that starts with 'Z'",
        "task_type": TaskType.TEXT,
        "placeholder": "Type your sentence here",
        "verification_prompt": "Verify the text is a complete sentence that contains at least one real word beginning with the letter Z.",
    },
    {
        "id": 23,
        "title": "Measure your current local temperature in degrees",
        "task_type": TaskType.NUMBER,
        "placeholder": "Enter temperature value",
        "verification_prompt": "Verify the submission is a realistic ambient weather temperature, ranging between -40 and 50.",
    },
    {
        "id": 24,
        "title": "Take a photo of your modern tech charging station",
        "task_type": TaskType.IMAGE,
        "placeholder": "Tap to capture or upload",
        "verification_prompt": "Verify the image shows electronic devices, charging cables, power blocks, or a wireless dock.",
    },
    {
        "id": 25,
        "title": "State what you ate for your last meal",
        "task_type": TaskType.TEXT,
        "placeholder": "I ate...",
        "verification_prompt": "Verify the text clearly names a food item, meal description, or ingredient list in a full sentence.",
    },
    {
        "id": 26,
        "title": "Count the chairs around your dining table",
        "task_type": TaskType.NUMBER,
        "placeholder": "Enter number of chairs",
        "verification_prompt": "Verify the submission is a standard count of household dining chairs, between 0 and 12.",
    },
    {
        "id": 27,
        "title": "Photograph an item that is completely blue",
        "task_type": TaskType.IMAGE,
        "placeholder": "Tap to capture or upload",
        "verification_prompt": "Verify the image features a prominent object where the primary color is visibly blue.",
    },
    {
        "id": 28,
        "title": "Describe the weather outside in three words",
        "task_type": TaskType.TEXT,
        "placeholder": "Sunny, warm, windy",
        "verification_prompt": "Verify the text consists of exactly three distinct descriptive words or a short three-word phrase about weather.",
    },
    {
        "id": 29,
        "title": "Count the number of letters in your first name",
        "task_type": TaskType.NUMBER,
        "placeholder": "Enter number of letters",
        "verification_prompt": "Verify the submission is a valid numeric value representing a typical name length, between 2 and 15.",
    },
    {
        "id": 30,
        "title": "Take a photo of a refrigerator magnet",
        "task_type": TaskType.IMAGE,
        "placeholder": "Tap to capture or upload",
        "verification_prompt": "Verify the image clearly displays one or more decorative magnets attached to a metal surface.",
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
