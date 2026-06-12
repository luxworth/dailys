from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user
from app.db.session import get_async_session
from app.models import User
from app.schemas import GhostDeployRequest, GhostDeployResponse, GhostDeployTransactionalResponse
from app.services.ghost import deploy_ghost
from app.services.interaction import build_ghost_deploy_interaction

router = APIRouter(prefix="/ghost", tags=["ghost"])


@router.post("/deploy", response_model=GhostDeployTransactionalResponse)
async def ghost_deploy(
    body: GhostDeployRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session),
) -> GhostDeployTransactionalResponse:
    result = await deploy_ghost(db, user.id, body.challenge_id)
    await db.commit()
    return GhostDeployTransactionalResponse(
        data=result,
        interaction=build_ghost_deploy_interaction(),
    )
