from fastapi import APIRouter

from app.features.auth.api import router as auth_router
from app.features.tenants.api import router as tenants_router

api_router = APIRouter()


@api_router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


api_router.include_router(auth_router)
api_router.include_router(tenants_router)
