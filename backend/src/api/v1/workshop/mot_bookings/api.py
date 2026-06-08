from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from .....config.database import get_db
from .....api.dependencies import get_current_user, get_tenant_context, require_permission
from .....models.common import ModulePermission
from ...http_common import tenant_id_str
from .schemas import (
    MotBooking,
    MotBookingCreate,
    MotBookingUpdate,
    MotBookingStatusUpdate,
    MotBookingsResponse,
    MotBookingStats,
)
from . import logic

router = APIRouter()


@router.get("/mot-bookings/stats", response_model=MotBookingStats)
async def get_mot_booking_stats(
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value)),
):
    return logic.get_mot_booking_stats(tenant_id_str(tenant_context), db)


@router.get("/mot-bookings", response_model=MotBookingsResponse)
async def list_mot_bookings(
    status_filter: Optional[str] = Query(None, alias="status"),
    test_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(True),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value)),
):
    return logic.list_mot_bookings(
        tenant_id_str(tenant_context),
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


@router.get("/mot-bookings/calendar", response_model=MotBookingsResponse)
async def list_mot_bookings_calendar(
    date_from: str = Query(..., description="YYYY-MM-DD"),
    date_to: str = Query(..., description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value)),
):
    return logic.list_mot_bookings_calendar(
        tenant_id_str(tenant_context), db, date_from, date_to
    )


@router.get("/mot-bookings/{booking_id}", response_model=MotBooking)
async def get_mot_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value)),
):
    return logic.get_mot_booking(tenant_id_str(tenant_context), booking_id, db)


@router.post("/mot-bookings", response_model=MotBooking, status_code=status.HTTP_201_CREATED)
async def create_mot_booking(
    body: MotBookingCreate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_CREATE.value)),
):
    return logic.create_mot_booking_record(tenant_id_str(tenant_context), body, db)


@router.put("/mot-bookings/{booking_id}", response_model=MotBooking)
async def update_mot_booking(
    booking_id: str,
    body: MotBookingUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_UPDATE.value)),
):
    return logic.update_mot_booking_record(tenant_id_str(tenant_context), booking_id, body, db)


@router.patch("/mot-bookings/{booking_id}/status", response_model=MotBooking)
async def update_mot_booking_status(
    booking_id: str,
    body: MotBookingStatusUpdate,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_UPDATE.value)),
):
    return logic.update_mot_booking_status(tenant_id_str(tenant_context), booking_id, body, db)


@router.delete("/mot-bookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mot_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    _=Depends(get_current_user),
    __=Depends(require_permission(ModulePermission.PRODUCTION_DELETE.value)),
):
    logic.delete_mot_booking_record(tenant_id_str(tenant_context), booking_id, db)
