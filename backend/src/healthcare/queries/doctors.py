from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import get_doctors, get_doctors_count, get_doctor_by_id
from ...models.healthcare_models import DoctorsResponse
from ..mappers import db_doctor_to_pydantic


def list_doctors_handler(
    tenant_id: str,
    db: Session,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 20,
) -> DoctorsResponse:
    skip = (page - 1) * limit
    db_doctors = get_doctors(db, tenant_id, skip=skip, limit=limit, search=search, is_active=is_active)
    total = get_doctors_count(db, tenant_id, search=search, is_active=is_active)
    doctors = [db_doctor_to_pydantic(d) for d in db_doctors]
    return DoctorsResponse(doctors=doctors, total=total)


def get_doctor_handler(tenant_id: str, doctor_id: str, db: Session):
    from ...models.healthcare_models import Doctor as DoctorPydantic

    db_doctor = get_doctor_by_id(doctor_id, db, tenant_id)
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    return db_doctor_to_pydantic(db_doctor)
