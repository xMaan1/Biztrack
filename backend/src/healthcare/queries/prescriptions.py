from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import (
    get_prescriptions,
    get_prescriptions_count,
    get_prescription_by_id,
    get_doctor_by_id,
    get_appointment_by_id,
)
from ...models.healthcare_models import PrescriptionsResponse
from ..mappers import db_prescription_to_pydantic


def list_prescriptions_handler(
    tenant_id: str,
    db: Session,
    appointment_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    patient_id: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> PrescriptionsResponse:
    skip = (page - 1) * limit
    db_rx_list = get_prescriptions(
        db,
        tenant_id,
        skip=skip,
        limit=limit,
        appointment_id=appointment_id,
        doctor_id=doctor_id,
        patient_id=patient_id,
        search=search,
    )
    total = get_prescriptions_count(
        db, tenant_id, appointment_id=appointment_id, doctor_id=doctor_id, patient_id=patient_id, search=search
    )
    doctors_map = {}
    appointments_map = {}
    for rx in db_rx_list:
        if str(rx.doctor_id) not in doctors_map:
            doctors_map[str(rx.doctor_id)] = get_doctor_by_id(str(rx.doctor_id), db, tenant_id)
        if str(rx.appointment_id) not in appointments_map:
            apt = get_appointment_by_id(str(rx.appointment_id), db, tenant_id)
            appointments_map[str(rx.appointment_id)] = (
                str(apt.appointment_date) if apt and apt.appointment_date else None
            )
    prescriptions = [
        db_prescription_to_pydantic(
            rx,
            doctors_map.get(str(rx.doctor_id)),
            appointments_map.get(str(rx.appointment_id)),
        )
        for rx in db_rx_list
    ]
    return PrescriptionsResponse(prescriptions=prescriptions, total=total)


def get_prescription_handler(tenant_id: str, prescription_id: str, db: Session):
    db_rx = get_prescription_by_id(prescription_id, db, tenant_id)
    if not db_rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    db_doctor = get_doctor_by_id(str(db_rx.doctor_id), db, tenant_id)
    apt = get_appointment_by_id(str(db_rx.appointment_id), db, tenant_id)
    apt_date = str(apt.appointment_date) if apt and apt.appointment_date else None
    return db_prescription_to_pydantic(db_rx, db_doctor, apt_date)
