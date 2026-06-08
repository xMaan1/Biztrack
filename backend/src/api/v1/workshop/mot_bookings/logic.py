from datetime import date, datetime as dt, timedelta
from typing import List, Optional
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from .....models.workshop import MotBooking
from .....models.crm import Customer
from .....config.vehicle_models import Vehicle
from .....config.workshop_models import WorkOrder
from .....models.user_models import User
from ...repository import get_by_id, create_entity, delete_by_id
from .schemas import (
    MotBookingCreate,
    MotBookingUpdate,
    MotBookingStatusUpdate,
    MotBookingsResponse,
    MotBookingStats,
)
from .shared import mot_booking_to_schema


def _technician_name(db: Session, user_id: Optional[str]) -> Optional[str]:
    if not user_id:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    return user.name or user.username or user.email


def _resolve_customer_fields(body, tenant_id: str, db: Session):
    customer_name = body.customer_name
    customer_phone = body.customer_phone
    customer_email = body.customer_email
    customer_id = body.customer_id
    if body.customer_id:
        db_customer = get_by_id(Customer, body.customer_id, db, tenant_id)
        if not db_customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        customer_name = f"{db_customer.firstName or ''} {db_customer.lastName or ''}".strip()
        customer_phone = db_customer.phone or db_customer.mobile
        customer_email = db_customer.email
    elif not (body.customer_name and body.customer_name.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either customer_id or customer_name is required",
        )
    else:
        customer_name = body.customer_name.strip()
    return customer_id, customer_name, customer_phone, customer_email


def _resolve_vehicle_fields(body, tenant_id: str, db: Session):
    vehicle_registration = body.vehicle_registration
    vehicle_make = body.vehicle_make
    vehicle_model = body.vehicle_model
    vehicle_id = body.vehicle_id
    mileage = body.mileage
    if body.vehicle_id:
        db_vehicle = get_by_id(Vehicle, body.vehicle_id, db, tenant_id)
        if not db_vehicle:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        vehicle_registration = db_vehicle.registration_number
        vehicle_make = db_vehicle.make
        vehicle_model = db_vehicle.model
        if not mileage and db_vehicle.mileage:
            mileage = db_vehicle.mileage
    return vehicle_id, vehicle_registration, vehicle_make, vehicle_model, mileage


def _validate_work_order(work_order_id: Optional[str], tenant_id: str, db: Session):
    if not work_order_id:
        return
    wo = get_by_id(WorkOrder, work_order_id, db, tenant_id)
    if not wo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")


def _validate_technician(technician_id: Optional[str], db: Session):
    if not technician_id:
        return
    user = db.query(User).filter(User.id == technician_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician not found")


def get_mot_bookings(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    test_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
) -> List[MotBooking]:
    query = db.query(MotBooking).filter(MotBooking.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(MotBooking.is_active == is_active)
    if status_filter:
        query = query.filter(MotBooking.status == status_filter)
    if test_type:
        query = query.filter(MotBooking.test_type == test_type)
    if date_from is not None:
        query = query.filter(MotBooking.booking_date >= date_from)
    if date_to is not None:
        query = query.filter(MotBooking.booking_date <= date_to)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            MotBooking.customer_name.ilike(search_lower)
            | MotBooking.vehicle_registration.ilike(search_lower)
            | MotBooking.customer_phone.ilike(search_lower)
            | MotBooking.vehicle_make.ilike(search_lower)
            | MotBooking.vehicle_model.ilike(search_lower)
        )
    return (
        query.order_by(MotBooking.booking_date.desc(), MotBooking.start_time.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_mot_bookings_count(
    db: Session,
    tenant_id: str,
    status_filter: Optional[str] = None,
    test_type: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
) -> int:
    query = db.query(MotBooking).filter(MotBooking.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(MotBooking.is_active == is_active)
    if status_filter:
        query = query.filter(MotBooking.status == status_filter)
    if test_type:
        query = query.filter(MotBooking.test_type == test_type)
    if date_from is not None:
        query = query.filter(MotBooking.booking_date >= date_from)
    if date_to is not None:
        query = query.filter(MotBooking.booking_date <= date_to)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            MotBooking.customer_name.ilike(search_lower)
            | MotBooking.vehicle_registration.ilike(search_lower)
            | MotBooking.customer_phone.ilike(search_lower)
            | MotBooking.vehicle_make.ilike(search_lower)
            | MotBooking.vehicle_model.ilike(search_lower)
        )
    return query.count()


def _retailer_name(row: MotBooking) -> Optional[str]:
    if row.retailer:
        return row.retailer.name
    meta = row.booking_meta or {}
    retailer = meta.get("retailer") if isinstance(meta, dict) else None
    if isinstance(retailer, dict):
        return retailer.get("name")
    return None


def _schema_for_row(row: MotBooking, db: Session, tech_cache: dict):
    tech_id = str(row.assigned_technician_id) if row.assigned_technician_id else None
    if tech_id and tech_id not in tech_cache:
        tech_cache[tech_id] = _technician_name(db, tech_id)
    return mot_booking_to_schema(
        row,
        tech_cache.get(tech_id) if tech_id else None,
        _retailer_name(row),
    )


def _map_bookings(rows: List[MotBooking], db: Session):
    tech_cache = {}
    return [_schema_for_row(row, db, tech_cache) for row in rows]


def list_mot_bookings(
    tenant_id: str,
    db: Session,
    status_filter: Optional[str] = None,
    test_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True,
    page: int = 1,
    limit: int = 100,
) -> MotBookingsResponse:
    date_from_parsed = dt.strptime(date_from, "%Y-%m-%d").date() if date_from else None
    date_to_parsed = dt.strptime(date_to, "%Y-%m-%d").date() if date_to else None
    skip = (page - 1) * limit
    rows = get_mot_bookings(
        db, tenant_id, skip=skip, limit=limit,
        status_filter=status_filter, test_type=test_type,
        date_from=date_from_parsed, date_to=date_to_parsed,
        search=search, is_active=is_active,
    )
    total = get_mot_bookings_count(
        db, tenant_id, status_filter=status_filter, test_type=test_type,
        date_from=date_from_parsed, date_to=date_to_parsed,
        search=search, is_active=is_active,
    )
    return MotBookingsResponse(bookings=_map_bookings(rows, db), total=total)


def list_mot_bookings_calendar(
    tenant_id: str,
    db: Session,
    date_from: str,
    date_to: str,
) -> MotBookingsResponse:
    date_from_parsed = dt.strptime(date_from, "%Y-%m-%d").date()
    date_to_parsed = dt.strptime(date_to, "%Y-%m-%d").date()
    rows = get_mot_bookings(
        db, tenant_id, skip=0, limit=1000,
        date_from=date_from_parsed, date_to=date_to_parsed, is_active=True,
    )
    bookings = _map_bookings(rows, db)
    return MotBookingsResponse(bookings=bookings, total=len(bookings))


def get_mot_booking(tenant_id: str, booking_id: str, db: Session):
    row = get_by_id(MotBooking, booking_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MOT booking not found")
    tech_name = _technician_name(db, str(row.assigned_technician_id) if row.assigned_technician_id else None)
    return mot_booking_to_schema(row, tech_name, _retailer_name(row))


def create_mot_booking_record(tenant_id: str, body: MotBookingCreate, db: Session):
    _validate_technician(body.assigned_technician_id, db)
    _validate_work_order(body.work_order_id, tenant_id, db)
    customer_id, customer_name, customer_phone, customer_email = _resolve_customer_fields(body, tenant_id, db)
    vehicle_id, vehicle_registration, vehicle_make, vehicle_model, mileage = _resolve_vehicle_fields(body, tenant_id, db)
    data = body.model_dump(exclude={"customer_id", "customer_name", "customer_phone", "customer_email", "vehicle_id", "vehicle_registration", "vehicle_make", "vehicle_model", "mileage"})
    data["tenant_id"] = tenant_id
    data["customer_id"] = customer_id
    data["customer_name"] = customer_name
    data["customer_phone"] = customer_phone
    data["customer_email"] = customer_email
    data["vehicle_id"] = vehicle_id
    data["vehicle_registration"] = vehicle_registration
    data["vehicle_make"] = vehicle_make
    data["vehicle_model"] = vehicle_model
    data["mileage"] = mileage
    data["is_active"] = True
    if isinstance(data.get("price"), Decimal):
        data["price"] = float(data["price"])
    row = create_entity(MotBooking, data, db)
    tech_name = _technician_name(db, str(row.assigned_technician_id) if row.assigned_technician_id else None)
    return mot_booking_to_schema(row, tech_name, _retailer_name(row))


def update_mot_booking_record(tenant_id: str, booking_id: str, body: MotBookingUpdate, db: Session):
    row = get_by_id(MotBooking, booking_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MOT booking not found")
    update_data = body.model_dump(exclude_unset=True)
    if body.assigned_technician_id is not None:
        _validate_technician(body.assigned_technician_id, db)
    if body.work_order_id is not None:
        _validate_work_order(body.work_order_id, tenant_id, db)
    if body.customer_id is not None or body.customer_name is not None:
        cid = body.customer_id if body.customer_id is not None else (str(row.customer_id) if row.customer_id else None)
        cname = body.customer_name if body.customer_name is not None else row.customer_name
        cphone = body.customer_phone if body.customer_phone is not None else row.customer_phone
        cemail = body.customer_email if body.customer_email is not None else row.customer_email
        temp = MotBookingCreate(
            customer_id=cid,
            customer_name=cname,
            customer_phone=cphone,
            customer_email=cemail,
            booking_date=row.booking_date,
            start_time=row.start_time,
            end_time=row.end_time,
        )
        cid, cname, cphone, cemail = _resolve_customer_fields(temp, tenant_id, db)
        update_data["customer_id"] = cid
        update_data["customer_name"] = cname
        update_data["customer_phone"] = cphone
        update_data["customer_email"] = cemail
    if body.vehicle_id is not None:
        temp = MotBookingCreate(
            customer_name=row.customer_name,
            vehicle_id=body.vehicle_id,
            vehicle_registration=body.vehicle_registration,
            vehicle_make=body.vehicle_make,
            vehicle_model=body.vehicle_model,
            mileage=body.mileage,
            booking_date=row.booking_date,
            start_time=row.start_time,
            end_time=row.end_time,
        )
        vid, vreg, vmake, vmodel, mileage = _resolve_vehicle_fields(temp, tenant_id, db)
        update_data["vehicle_id"] = vid
        update_data["vehicle_registration"] = vreg
        update_data["vehicle_make"] = vmake
        update_data["vehicle_model"] = vmodel
        if body.mileage is not None or mileage:
            update_data["mileage"] = body.mileage if body.mileage is not None else mileage
    if "price" in update_data and isinstance(update_data["price"], Decimal):
        update_data["price"] = float(update_data["price"])
    for key, value in update_data.items():
        if hasattr(row, key):
            setattr(row, key, value)
    row.updated_at = dt.utcnow()
    db.commit()
    db.refresh(row)
    tech_name = _technician_name(db, str(row.assigned_technician_id) if row.assigned_technician_id else None)
    return mot_booking_to_schema(row, tech_name, _retailer_name(row))


def update_mot_booking_status(tenant_id: str, booking_id: str, body: MotBookingStatusUpdate, db: Session):
    row = get_by_id(MotBooking, booking_id, db, tenant_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MOT booking not found")
    row.status = body.status
    if body.result_notes is not None:
        row.result_notes = body.result_notes
    row.updated_at = dt.utcnow()
    db.commit()
    db.refresh(row)
    tech_name = _technician_name(db, str(row.assigned_technician_id) if row.assigned_technician_id else None)
    return mot_booking_to_schema(row, tech_name, _retailer_name(row))


def delete_mot_booking_record(tenant_id: str, booking_id: str, db: Session) -> None:
    deleted = delete_by_id(MotBooking, booking_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MOT booking not found")


def get_mot_booking_stats(tenant_id: str, db: Session) -> MotBookingStats:
    today = date.today()
    week_end = today + timedelta(days=7)
    base = db.query(MotBooking).filter(MotBooking.tenant_id == tenant_id, MotBooking.is_active == True)
    total = base.count()
    today_count = base.filter(MotBooking.booking_date == today).count()
    upcoming = base.filter(
        MotBooking.booking_date >= today,
        MotBooking.booking_date <= week_end,
        MotBooking.status.in_(["scheduled", "confirmed"]),
    ).count()
    status_counts = dict(
        db.query(MotBooking.status, func.count(MotBooking.id))
        .filter(MotBooking.tenant_id == tenant_id, MotBooking.is_active == True)
        .group_by(MotBooking.status)
        .all()
    )
    return MotBookingStats(
        total_bookings=total,
        today_bookings=today_count,
        upcoming_week=upcoming,
        scheduled_count=status_counts.get("scheduled", 0),
        confirmed_count=status_counts.get("confirmed", 0),
        in_progress_count=status_counts.get("in_progress", 0),
        passed_count=status_counts.get("passed", 0),
        failed_count=status_counts.get("failed", 0),
        cancelled_count=status_counts.get("cancelled", 0) + status_counts.get("no_show", 0),
    )
