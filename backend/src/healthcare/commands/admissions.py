from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import (
    get_doctor_by_id,
    get_patient_by_id,
    get_admission_by_id,
    create_admission,
    update_admission,
    delete_admission,
)
from ...models.healthcare_models import AdmissionCreate, AdmissionUpdate
from ..mappers import db_admission_to_pydantic


def create_admission_handler(tenant_id: str, body: AdmissionCreate, db: Session):
    db_doctor = get_doctor_by_id(body.doctor_id, db, tenant_id)
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    db_patient = get_patient_by_id(body.patient_id, db, tenant_id)
    if not db_patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    admission_data = {
        "tenant_id": tenant_id,
        "patient_id": body.patient_id,
        "doctor_id": body.doctor_id,
        "admit_date": body.admit_date,
        "discharge_date": body.discharge_date,
        "status": body.status,
        "ward": body.ward,
        "room_or_bed": body.room_or_bed,
        "diagnosis": body.diagnosis,
        "notes": body.notes,
        "is_active": True,
    }
    db_admission = create_admission(admission_data, db)
    return db_admission_to_pydantic(db_admission, db_patient, db_doctor)


def update_admission_handler(tenant_id: str, admission_id: str, body: AdmissionUpdate, db: Session):
    db_adm = get_admission_by_id(admission_id, db, tenant_id)
    if not db_adm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")
    if body.doctor_id is not None:
        db_doctor = get_doctor_by_id(body.doctor_id, db, tenant_id)
        if not db_doctor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    update_data = body.model_dump(exclude_unset=True)
    updated = update_admission(admission_id, update_data, db, tenant_id)
    db_patient = get_patient_by_id(str(updated.patient_id), db, tenant_id)
    db_doctor = get_doctor_by_id(str(updated.doctor_id), db, tenant_id)
    return db_admission_to_pydantic(updated, db_patient, db_doctor)


def delete_admission_handler(tenant_id: str, admission_id: str, db: Session) -> None:
    deleted = delete_admission(admission_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")
