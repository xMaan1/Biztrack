from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import create_patient, update_patient, delete_patient
from ...models.healthcare_models import PatientCreate, PatientUpdate
from ..mappers import db_patient_to_pydantic


def create_patient_handler(tenant_id: str, body: PatientCreate, db: Session):
    patient_data = {
        "tenant_id": tenant_id,
        "full_name": body.full_name,
        "phone": body.phone,
        "email": body.email,
        "date_of_birth": body.date_of_birth,
        "address": body.address,
        "notes": body.notes,
        "is_active": True,
    }
    db_patient = create_patient(patient_data, db)
    return db_patient_to_pydantic(db_patient)


def update_patient_handler(tenant_id: str, patient_id: str, body: PatientUpdate, db: Session):
    updated = update_patient(patient_id, body.model_dump(exclude_unset=True), db, tenant_id)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return db_patient_to_pydantic(updated)


def delete_patient_handler(tenant_id: str, patient_id: str, db: Session) -> None:
    deleted = delete_patient(patient_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
