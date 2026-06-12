import asyncio

from app.db.session import async_session_factory
from app.scripts.seed_task_templates import seed_task_templates


async def main() -> None:
    async with async_session_factory() as session:
        count = await seed_task_templates(session)
        print(f"Seeded {count} task template(s).")


if __name__ == "__main__":
    asyncio.run(main())
