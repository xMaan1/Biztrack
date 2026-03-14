from datetime import datetime as dt
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import (
    get_admissions,
    get_admissions_count,
    get_admission_by_id,
    get_patient_by_id,
    get_doctor_by_id,
)
from ...models.healthcare_models import AdmissionsResponse
from ..mappers import db_admission_to_pydantic


def list_admissions_handler(
    tenant_id: str,
    db: Session,
    status: Optional[str] = None,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = 1,
    limit: int = 100,
) -> AdmissionsResponse:
    date_from_parsed = dt.strptime(date_from, "%Y-%m-%d").date() if date_from else None
    date_to_parsed = dt.strptime(date_to, "%Y-%m-%d").date() if date_to else None
    skip = (page - 1) * limit
    db_admissions = get_admissions(
        db,
        tenant_id,
        skip=skip,
        limit=limit,
        status=status,
        patient_id=patient_id,
        doctor_id=doctor_id,
        date_from=date_from_parsed,
        date_to=date_to_parsed,
        search=search,
        is_active=is_active,
    )
    total = get_admissions_count(
        db,
        tenant_id,
        status=status,
        patient_id=patient_id,
        doctor_id=doctor_id,
        date_from=date_from_parsed,
        date_to=date_to_parsed,
        search=search,
        is_active=is_active,
    )
    patients_map = {}
    doctors_map = {}
    for adm in db_admissions:
        if str(adm.patient_id) not in patients_map:
            patients_map[str(adm.patient_id)] = get_patient_by_id(str(adm.patient_id), db, tenant_id)
        if str(adm.doctor_id) not in doctors_map:
            doctors_map[str(adm.doctor_id)] = get_doctor_by_id(str(adm.doctor_id), db, tenant_id)
    admissions = [
        db_admission_to_pydantic(a, patients_map.get(str(a.patient_id)), doctors_map.get(str(a.doctor_id)))
        for a in db_admissions
    ]
    return AdmissionsResponse(admissions=admissions, total=total)


def get_admission_handler(tenant_id: str, admission_id: str, db: Session):
    db_adm = get_admission_by_id(admission_id, db, tenant_id)
    if not db_adm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Admission not found")
    db_patient = get_patient_by_id(str(db_adm.patient_id), db, tenant_id)
    db_doctor = get_doctor_by_id(str(db_adm.doctor_id), db, tenant_id)
    return db_admission_to_pydantic(db_adm, db_patient, db_doctor)
