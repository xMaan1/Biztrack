from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from .healthcare_models import Doctor


def get_doctor_by_id(doctor_id: str, db: Session, tenant_id: Optional[str] = None) -> Optional[Doctor]:
    query = db.query(Doctor).filter(Doctor.id == doctor_id)
    if tenant_id:
        query = query.filter(Doctor.tenant_id == tenant_id)
    return query.first()


def get_doctor_by_pmdc(tenant_id: str, pmdc_number: str, db: Session) -> Optional[Doctor]:
    return db.query(Doctor).filter(
        Doctor.tenant_id == tenant_id,
        Doctor.pmdc_number == pmdc_number
    ).first()


def get_doctors(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_active: Optional[bool] = None
) -> List[Doctor]:
    query = db.query(Doctor).filter(Doctor.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Doctor.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Doctor.first_name.ilike(search_lower) |
            Doctor.last_name.ilike(search_lower) |
            Doctor.pmdc_number.ilike(search_lower) |
            Doctor.phone.ilike(search_lower) |
            or_(Doctor.specialization.is_(None), Doctor.specialization.ilike(search_lower))
        )
    return query.order_by(Doctor.createdAt.desc()).offset(skip).limit(limit).all()


def get_doctors_count(
    db: Session,
    tenant_id: str,
    search: Optional[str] = None,
    is_active: Optional[bool] = None
) -> int:
    query = db.query(Doctor).filter(Doctor.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Doctor.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Doctor.first_name.ilike(search_lower) |
            Doctor.last_name.ilike(search_lower) |
            Doctor.pmdc_number.ilike(search_lower) |
            Doctor.phone.ilike(search_lower) |
            or_(Doctor.specialization.is_(None), Doctor.specialization.ilike(search_lower))
        )
    return query.count()


def create_doctor(doctor_data: dict, db: Session) -> Doctor:
    db_doctor = Doctor(**doctor_data)
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor


def update_doctor(doctor_id: str, update_data: dict, db: Session, tenant_id: Optional[str] = None) -> Optional[Doctor]:
    doctor = get_doctor_by_id(doctor_id, db, tenant_id)
    if not doctor:
        return None
    for key, value in update_data.items():
        if hasattr(doctor, key):
            setattr(doctor, key, value)
    db.commit()
    db.refresh(doctor)
    return doctor


def delete_doctor(doctor_id: str, db: Session, tenant_id: Optional[str] = None) -> bool:
    doctor = get_doctor_by_id(doctor_id, db, tenant_id)
    if doctor:
        db.delete(doctor)
        db.commit()
        return True
    return False
