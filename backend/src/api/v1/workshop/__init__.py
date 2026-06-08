from fastapi import APIRouter

from .mot_bookings.api import router as mot_bookings_router
from .mot_retailers.api import router as mot_retailers_router

router = APIRouter(prefix="/workshop", tags=["workshop"])
router.include_router(mot_bookings_router)
router.include_router(mot_retailers_router)
