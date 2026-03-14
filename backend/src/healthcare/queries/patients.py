from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import (
    get_patients,
    get_patients_count,
    get_patient_by_id,
    get_appointments,
    get_appointments_count,
    get_prescriptions,
    get_doctor_by_id,
    get_appointment_by_id,
)
from ...models.healthcare_models import PatientsResponse, PatientHistoryResponse
from ..mappers import db_patient_to_pydantic, db_appointment_to_pydantic, db_prescription_to_pydantic


def list_patients_handler(
    tenant_id: str,
    db: Session,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 50,
) -> PatientsResponse:
    skip = (page - 1) * limit
    db_patients = get_patients(db, tenant_id, skip=skip, limit=limit, search=search, is_active=is_active)
    total = get_patients_count(db, tenant_id, search=search, is_active=is_active)
    patients = [db_patient_to_pydantic(p) for p in db_patients]
    return PatientsResponse(patients=patients, total=total)


def get_patient_handler(tenant_id: str, patient_id: str, db: Session):
    db_patient = get_patient_by_id(patient_id, db, tenant_id)
    if not db_patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return db_patient_to_pydantic(db_patient)


def get_patient_history_handler(tenant_id: str, patient_id: str, db: Session) -> PatientHistoryResponse:
    db_patient = get_patient_by_id(patient_id, db, tenant_id)
    if not db_patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    patient = db_patient_to_pydantic(db_patient)
    db_appointments = get_appointments(
        db, tenant_id, skip=0, limit=500, patient_id=patient_id, is_active=None
    )
    doctors_map = {}
    for apt in db_appointments:
        if str(apt.doctor_id) not in doctors_map:
            doctors_map[str(apt.doctor_id)] = get_doctor_by_id(str(apt.doctor_id), db, tenant_id)
    appointments = [
        db_appointment_to_pydantic(a, doctors_map.get(str(a.doctor_id)))
        for a in db_appointments
    ]
    db_prescriptions = get_prescriptions(
        db, tenant_id, skip=0, limit=500, patient_id=patient_id
    )
    doctors_map_rx = {}
    appointments_map = {}
    for rx in db_prescriptions:
        if str(rx.doctor_id) not in doctors_map_rx:
            doctors_map_rx[str(rx.doctor_id)] = get_doctor_by_id(str(rx.doctor_id), db, tenant_id)
        if str(rx.appointment_id) not in appointments_map:
            apt = get_appointment_by_id(str(rx.appointment_id), db, tenant_id)
            appointments_map[str(rx.appointment_id)] = (
                str(apt.appointment_date) if apt and apt.appointment_date else None
            )
    prescriptions = [
        db_prescription_to_pydantic(
            rx,
            doctors_map_rx.get(str(rx.doctor_id)),
            appointments_map.get(str(rx.appointment_id)),
        )
        for rx in db_prescriptions
    ]
    return PatientHistoryResponse(patient=patient, appointments=appointments, prescriptions=prescriptions)
