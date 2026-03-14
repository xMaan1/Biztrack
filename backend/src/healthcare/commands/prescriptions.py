from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import (
    get_doctor_by_id,
    get_appointment_by_id,
    get_prescription_by_id,
    create_prescription,
    update_prescription,
    delete_prescription,
)
from ...models.healthcare_models import PrescriptionCreate, PrescriptionUpdate
from ..mappers import db_prescription_to_pydantic, prescription_items_to_db


def create_prescription_handler(tenant_id: str, body: PrescriptionCreate, db: Session):
    apt = get_appointment_by_id(body.appointment_id, db, tenant_id)
    if not apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    db_doctor = get_doctor_by_id(body.doctor_id, db, tenant_id)
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    rx_data = {
        "tenant_id": tenant_id,
        "appointment_id": body.appointment_id,
        "doctor_id": body.doctor_id,
        "patient_name": body.patient_name,
        "patient_phone": body.patient_phone,
        "prescription_date": body.prescription_date,
        "notes": body.notes,
        "items": prescription_items_to_db(body.items or []),
    }
    db_rx = create_prescription(rx_data, db)
    return db_prescription_to_pydantic(db_rx, db_doctor, str(apt.appointment_date))


def update_prescription_handler(tenant_id: str, prescription_id: str, body: PrescriptionUpdate, db: Session):
    db_rx = get_prescription_by_id(prescription_id, db, tenant_id)
    if not db_rx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
    if body.doctor_id is not None:
        if not get_doctor_by_id(body.doctor_id, db, tenant_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    update_data = body.model_dump(exclude_unset=True)
    if "items" in update_data and update_data["items"] is not None:
        update_data["items"] = prescription_items_to_db(update_data["items"])
    updated = update_prescription(prescription_id, update_data, db, tenant_id)
    db_doctor = get_doctor_by_id(str(updated.doctor_id), db, tenant_id)
    apt = get_appointment_by_id(str(updated.appointment_id), db, tenant_id)
    apt_date = str(apt.appointment_date) if apt and apt.appointment_date else None
    return db_prescription_to_pydantic(updated, db_doctor, apt_date)


def delete_prescription_handler(tenant_id: str, prescription_id: str, db: Session) -> None:
    deleted = delete_prescription(prescription_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prescription not found")
