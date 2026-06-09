from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from ....config.database import get_db
from ....api.dependencies import get_current_user
from ....api.v1.admin.shared import is_super_admin
from .bookings.schemas import (
    MotBooking,
    MotBookingCreate,
    MotBookingUpdate,
    MotBookingStatusUpdate,
    MotBookingsResponse,
    MotBookingStats,
)
from .bookings import logic as booking_logic
from .retailers.schemas import MotRetailer, MotRetailerCreate, MotRetailerUpdate, MotRetailersResponse
from .retailers import logic as retailer_logic

public_router = APIRouter(prefix="/public/mot", tags=["public-mot"])
admin_router = APIRouter(prefix="/mot", tags=["mot-admin"])


def require_mot_admin(current_user=Depends(get_current_user)):
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="MOT admin access required",
        )
    return current_user


@public_router.get("/retailers", response_model=MotRetailersResponse)
async def list_public_mot_retailers(db: Session = Depends(get_db)):
    return retailer_logic.list_mot_retailers(db)


@public_router.get("/bookings/calendar", response_model=MotBookingsResponse)
async def list_public_mot_bookings_calendar(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    return booking_logic.list_mot_bookings_calendar(db, date_from, date_to)


@public_router.post("/bookings", response_model=MotBooking, status_code=status.HTTP_201_CREATED)
async def create_public_mot_booking(body: MotBookingCreate, db: Session = Depends(get_db)):
    return booking_logic.create_mot_booking_record(body, db)


@public_router.get("/bookings/{booking_id}", response_model=MotBooking)
async def get_public_mot_booking(booking_id: str, db: Session = Depends(get_db)):
    return booking_logic.get_mot_booking(booking_id, db)


@public_router.put("/bookings/{booking_id}", response_model=MotBooking)
async def update_public_mot_booking(
    booking_id: str,
    body: MotBookingUpdate,
    db: Session = Depends(get_db),
):
    return booking_logic.update_mot_booking_record(booking_id, body, db)


@public_router.patch("/bookings/{booking_id}/status", response_model=MotBooking)
async def update_public_mot_booking_status(
    booking_id: str,
    body: MotBookingStatusUpdate,
    db: Session = Depends(get_db),
):
    if body.status not in ("cancelled",):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only cancellation is allowed via public booking",
        )
    return booking_logic.update_mot_booking_status(booking_id, body, db)


@admin_router.get("/bookings/stats", response_model=MotBookingStats)
async def get_mot_booking_stats(
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    return booking_logic.get_mot_booking_stats(db)


@admin_router.get("/bookings", response_model=MotBookingsResponse)
async def list_mot_bookings_admin(
    status_filter: Optional[str] = Query(None, alias="status"),
    test_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    return booking_logic.list_mot_bookings(
        db,
        status_filter=status_filter,
        test_type=test_type,
        date_from=date_from,
        date_to=date_to,
        search=search,
        is_active=is_active,
        page=page,
        limit=limit,
    )


@admin_router.get("/bookings/calendar", response_model=MotBookingsResponse)
async def list_mot_bookings_calendar_admin(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    return booking_logic.list_mot_bookings_calendar(db, date_from, date_to)


@admin_router.get("/bookings/{booking_id}", response_model=MotBooking)
async def get_mot_booking_admin(
    booking_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    return booking_logic.get_mot_booking(booking_id, db)


@admin_router.post("/bookings", response_model=MotBooking, status_code=status.HTTP_201_CREATED)
async def create_mot_booking_admin(
    body: MotBookingCreate,
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    return booking_logic.create_mot_booking_record(body, db)


@admin_router.put("/bookings/{booking_id}", response_model=MotBooking)
async def update_mot_booking_admin(
    booking_id: str,
    body: MotBookingUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    return booking_logic.update_mot_booking_record(booking_id, body, db)


@admin_router.patch("/bookings/{booking_id}/status", response_model=MotBooking)
async def update_mot_booking_status_admin(
    booking_id: str,
    body: MotBookingStatusUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    return booking_logic.update_mot_booking_status(booking_id, body, db)


@admin_router.delete("/bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mot_booking_admin(
    booking_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    booking_logic.delete_mot_booking_record(booking_id, db)


@admin_router.get("/retailers", response_model=MotRetailersResponse)
async def list_mot_retailers_admin(
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    return retailer_logic.list_mot_retailers(db)


@admin_router.post("/retailers", response_model=MotRetailer, status_code=status.HTTP_201_CREATED)
async def create_mot_retailer_admin(
    body: MotRetailerCreate,
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    return retailer_logic.create_mot_retailer(body, db)


@admin_router.put("/retailers/{retailer_id}", response_model=MotRetailer)
async def update_mot_retailer_admin(
    retailer_id: str,
    body: MotRetailerUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    return retailer_logic.update_mot_retailer(retailer_id, body, db)


@admin_router.post("/retailers/{retailer_id}/set-default", response_model=MotRetailer)
async def set_default_mot_retailer_admin(
    retailer_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    return retailer_logic.set_default_mot_retailer(retailer_id, db)


@admin_router.delete("/retailers/{retailer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mot_retailer_admin(
    retailer_id: str,
    db: Session = Depends(get_db),
    _=Depends(require_mot_admin),
):
    retailer_logic.delete_mot_retailer(retailer_id, db)
