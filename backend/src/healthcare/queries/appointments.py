from datetime import datetime as dt
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import (
    get_appointments,
    get_appointments_count,
    get_appointment_by_id,
    get_doctor_by_id,
)
from ...models.healthcare_models import AppointmentsResponse
from ..mappers import db_appointment_to_pydantic


def list_appointments_handler(
    tenant_id: str,
    db: Session,
    doctor_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 100,
) -> AppointmentsResponse:
    date_from_parsed = dt.strptime(date_from, "%Y-%m-%d").date() if date_from else None
    date_to_parsed = dt.strptime(date_to, "%Y-%m-%d").date() if date_to else None
    skip = (page - 1) * limit
    db_appointments = get_appointments(
        db,
        tenant_id,
        skip=skip,
        limit=limit,
        doctor_id=doctor_id,
        date_from=date_from_parsed,
        date_to=date_to_parsed,
        search=search,
        is_active=is_active,
    )
    total = get_appointments_count(
        db,
        tenant_id,
        doctor_id=doctor_id,
        date_from=date_from_parsed,
        date_to=date_to_parsed,
        search=search,
        is_active=is_active,
    )
    doctors_map = {}
    for apt in db_appointments:
        if str(apt.doctor_id) not in doctors_map:
            doctors_map[str(apt.doctor_id)] = get_doctor_by_id(str(apt.doctor_id), db, tenant_id)
    appointments = [
        db_appointment_to_pydantic(a, doctors_map.get(str(a.doctor_id)))
        for a in db_appointments
    ]
    return AppointmentsResponse(appointments=appointments, total=total)


def list_appointments_calendar_handler(
    tenant_id: str,
    db: Session,
    date_from: str,
    date_to: str,
    doctor_id: Optional[str] = None,
) -> AppointmentsResponse:
    date_from_parsed = dt.strptime(date_from, "%Y-%m-%d").date()
    date_to_parsed = dt.strptime(date_to, "%Y-%m-%d").date()
    db_appointments = get_appointments(
        db,
        tenant_id,
        skip=0,
        limit=1000,
        doctor_id=doctor_id,
        date_from=date_from_parsed,
        date_to=date_to_parsed,
        is_active=True,
    )
    doctors_map = {}
    for apt in db_appointments:
        if str(apt.doctor_id) not in doctors_map:
            doctors_map[str(apt.doctor_id)] = get_doctor_by_id(str(apt.doctor_id), db, tenant_id)
    appointments = [
        db_appointment_to_pydantic(a, doctors_map.get(str(a.doctor_id)))
        for a in db_appointments
    ]
    return AppointmentsResponse(appointments=appointments, total=len(appointments))


def get_appointment_handler(tenant_id: str, appointment_id: str, db: Session):
    db_apt = get_appointment_by_id(appointment_id, db, tenant_id)
    if not db_apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    db_doctor = get_doctor_by_id(str(db_apt.doctor_id), db, tenant_id)
    return db_appointment_to_pydantic(db_apt, db_doctor)
