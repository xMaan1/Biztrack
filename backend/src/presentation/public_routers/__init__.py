from fastapi import APIRouter
from .plans import router as plans_router

router = APIRouter()
router.include_router(plans_router, prefix="/public", tags=["public"])

__all__ = ['router']

