from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.db.session import get_async_session
from app.models import ItemType, User, UserItem
from app.schemas import (
    MySquadResponse,
    PercentileResponse,
    SquadCreate,
    SquadCreatedResponse,
    SquadJoin,
    SquadLeaderboardResponse,
    StreakResponse,
    UserHistoryResponse,
    UserItemsResponse,
)
from app.services.history import get_user_history
from app.services.squads import create_squad, get_my_squad, get_squad_leaderboard, join_squad
from app.services.streak import calculate_percentile, calculate_streak

router = APIRouter(tags=["squads"])


@router.post("/squads", response_model=SquadCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_squad_endpoint(
    body: SquadCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> SquadCreatedResponse:
    return await create_squad(db, user, body.name)


@router.post("/squads/join", response_model=MySquadResponse)
async def join_squad_endpoint(
    body: SquadJoin,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> MySquadResponse:
    return await join_squad(db, user, body.invite_code)


@router.get("/users/me/squad", response_model=MySquadResponse | None)
async def my_squad(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> MySquadResponse | None:
    return await get_my_squad(db, user)


@router.get("/squads/{squad_id}/leaderboard", response_model=SquadLeaderboardResponse)
async def squad_leaderboard(
    squad_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> SquadLeaderboardResponse:
    return await get_squad_leaderboard(db, squad_id)


@router.get("/users/me/streak", response_model=StreakResponse)
async def my_streak(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> StreakResponse:
    streak = await calculate_streak(db, user.id)
    return StreakResponse(streak=streak)


@router.get("/users/me/items", response_model=UserItemsResponse)
async def my_items(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> UserItemsResponse:
    result = await db.execute(
        select(UserItem).where(UserItem.user_id == user.id, UserItem.item_type == ItemType.GHOST)
    )
    item = result.scalar_one_or_none()
    return UserItemsResponse(ghost=item.quantity if item else 0)


@router.get("/users/me/percentile", response_model=PercentileResponse)
async def my_percentile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> PercentileResponse:
    percentile = await calculate_percentile(db, user.id)
    return PercentileResponse(percentile=percentile)


@router.get("/users/me/history", response_model=UserHistoryResponse)
async def my_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
    days: int = Query(default=30, ge=1, le=90),
    trace_limit: int = Query(default=10, ge=1, le=50),
) -> UserHistoryResponse:
    return await get_user_history(db, user, days=days, trace_limit=trace_limit)
