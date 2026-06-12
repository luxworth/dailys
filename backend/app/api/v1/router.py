from fastapi import APIRouter

from app.api.v1 import auth, challenges, ghost, internal, reactions, squads, submissions, uploads

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(challenges.router)
api_router.include_router(submissions.router)
api_router.include_router(reactions.router)
api_router.include_router(squads.router)
api_router.include_router(ghost.router)
api_router.include_router(internal.router)
api_router.include_router(uploads.router)
