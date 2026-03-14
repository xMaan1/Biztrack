from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from ...config.database import get_doctor_by_id, get_doctor_by_pmdc, create_doctor, update_doctor, delete_doctor
from ...models.healthcare_models import DoctorCreate, DoctorUpdate
from ..mappers import db_doctor_to_pydantic, availability_to_db


def create_doctor_handler(tenant_id: str, body: DoctorCreate, db: Session):
    existing = get_doctor_by_pmdc(tenant_id, body.pmdc_number, db)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A doctor with this PMDC number already exists for this tenant",
        )
    doctor_data = {
        "tenant_id": tenant_id,
        "pmdc_number": body.pmdc_number,
        "phone": body.phone,
        "first_name": body.first_name,
        "last_name": body.last_name,
        "email": body.email,
        "specialization": body.specialization,
        "qualification": body.qualification,
        "address": body.address,
        "availability": availability_to_db(body.availability),
        "is_active": True,
    }
    db_doctor = create_doctor(doctor_data, db)
    return db_doctor_to_pydantic(db_doctor)


def update_doctor_handler(tenant_id: str, doctor_id: str, body: DoctorUpdate, db: Session):
    db_doctor = get_doctor_by_id(doctor_id, db, tenant_id)
    if not db_doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    if body.pmdc_number is not None and body.pmdc_number != db_doctor.pmdc_number:
        existing = get_doctor_by_pmdc(tenant_id, body.pmdc_number, db)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A doctor with this PMDC number already exists for this tenant",
            )
    update_data = body.model_dump(exclude_unset=True)
    if "availability" in update_data and update_data["availability"] is not None:
        update_data["availability"] = availability_to_db(update_data["availability"])
    updated = update_doctor(doctor_id, update_data, db, tenant_id)
    return db_doctor_to_pydantic(updated)


def delete_doctor_handler(tenant_id: str, doctor_id: str, db: Session) -> None:
    deleted = delete_doctor(doctor_id, db, tenant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
