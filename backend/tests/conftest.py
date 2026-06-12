import os

os.environ.setdefault("ENVIRONMENT", "dev")
os.environ.setdefault("INTERNAL_API_KEY", "test-key")

from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.db.base import Base
from app.main import app
from app.scripts.seed_task_templates import seed_task_templates
from tests.helpers import TEST_DATABASE_URL

get_settings.cache_clear()


@pytest.fixture(autouse=True)
def _reset_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def _disable_rate_limiter():
    from app.limiter import limiter

    limiter.enabled = False
    yield
    limiter.enabled = True


@pytest.fixture
async def engine():
    eng = create_async_engine(TEST_DATABASE_URL, pool_pre_ping=True)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as session:
        await seed_task_templates(session)
        yield session


@pytest.fixture
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    from app.db import session as db_module

    async def override_get_session():
        yield db_session

    app.dependency_overrides[db_module.get_async_session] = override_get_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
