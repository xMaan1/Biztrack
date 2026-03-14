from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import (
    get_doctor_by_id,
    get_patient_by_id,
    get_appointment_by_id,
    create_appointment,
    update_appointment,
    delete_appointment,
)
from ...models.healthcare_models import AppointmentCreate, AppointmentUpdate
from ..mappers import db_appointment_to_pydantic


def create_appointment_handler(tenant_id: str, body: AppointmentCreate, db: Session):
    db_doctor = get_doctor_by_id(body.doctor_id, db, tenant_id)
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    patient_name = body.patient_name
    patient_phone = body.patient_phone
    patient_id = body.patient_id
    if body.patient_id:
        db_patient = get_patient_by_id(body.patient_id, db, tenant_id)
        if not db_patient:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
        patient_name = db_patient.full_name
        patient_phone = db_patient.phone
    elif not (body.patient_name and body.patient_name.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either patient_id or patient_name is required",
        )
    else:
        patient_name = body.patient_name.strip()
        patient_phone = body.patient_phone
    appointment_data = {
        "tenant_id": tenant_id,
        "doctor_id": body.doctor_id,
        "patient_id": patient_id,
        "patient_name": patient_name,
        "patient_phone": patient_phone,
        "appointment_date": body.appointment_date,
        "start_time": body.start_time,
        "end_time": body.end_time,
        "status": body.status,
        "notes": body.notes,
        "is_active": True,
    }
    db_appointment = create_appointment(appointment_data, db)
    return db_appointment_to_pydantic(db_appointment, db_doctor)


def update_appointment_handler(tenant_id: str, appointment_id: str, body: AppointmentUpdate, db: Session):
    db_apt = get_appointment_by_id(appointment_id, db, tenant_id)
    if not db_apt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    if body.doctor_id is not None:
        db_doctor = get_doctor_by_id(body.doctor_id, db, tenant_id)
        if not db_doctor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    update_data = body.model_dump(exclude_unset=True)
    if body.patient_id is not None:
        if body.patient_id:
            db_patient = get_patient_by_id(body.patient_id, db, tenant_id)
            if not db_patient:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
            update_data["patient_name"] = db_patient.full_name
            update_data["patient_phone"] = db_patient.phone
        else:
            update_data["patient_id"] = None
            update_data["patient_name"] = update_data.get("patient_name") or ""
            update_data["patient_phone"] = update_data.get("patient_phone")
    updated = update_appointment(appointment_id, update_data, db, tenant_id)
    db_doctor = get_doctor_by_id(str(updated.doctor_id), db, tenant_id)
    return db_appointment_to_pydantic(updated, db_doctor)


def delete_appointment_handler(tenant_id: str, appointment_id: str, db: Session) -> None:
    deleted = delete_appointment(appointment_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
