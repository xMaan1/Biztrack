from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import get_patients, get_patients_count, get_patient_by_id
from ...models.healthcare_models import PatientsResponse
from ..mappers import db_patient_to_pydantic


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
