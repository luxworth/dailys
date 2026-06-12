from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.limiter import limiter

router = APIRouter(tags=["health"])


@router.get("/health")
@limiter.exempt
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
@limiter.exempt
async def ready(db: AsyncSession = Depends(get_async_session)) -> JSONResponse:
    try:
        await db.execute(text("SELECT 1"))
        return JSONResponse(status_code=status.HTTP_200_OK, content={"status": "ready"})
    except Exception:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unavailable", "detail": "database unreachable"},
        )
