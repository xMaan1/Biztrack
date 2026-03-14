from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from .healthcare_models import Doctor, HealthcareStaff, Appointment, Prescription, Patient
from .core_models import User


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


def get_healthcare_staff_by_id(staff_id: str, db: Session, tenant_id: Optional[str] = None) -> Optional[HealthcareStaff]:
    query = db.query(HealthcareStaff).filter(HealthcareStaff.id == staff_id)
    if tenant_id:
        query = query.filter(HealthcareStaff.tenant_id == tenant_id)
    return query.first()


def get_healthcare_staff(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[HealthcareStaff]:
    query = db.query(HealthcareStaff).join(User, HealthcareStaff.user_id == User.id).filter(HealthcareStaff.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(HealthcareStaff.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            User.userName.ilike(search_lower) |
            User.email.ilike(search_lower) |
            User.firstName.ilike(search_lower) |
            User.lastName.ilike(search_lower) |
            HealthcareStaff.phone.ilike(search_lower) |
            HealthcareStaff.role.ilike(search_lower)
        )
    return query.order_by(HealthcareStaff.createdAt.desc()).offset(skip).limit(limit).all()


def get_healthcare_staff_count(
    db: Session,
    tenant_id: str,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> int:
    query = db.query(HealthcareStaff).join(User, HealthcareStaff.user_id == User.id).filter(HealthcareStaff.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(HealthcareStaff.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            User.userName.ilike(search_lower) |
            User.email.ilike(search_lower) |
            User.firstName.ilike(search_lower) |
            User.lastName.ilike(search_lower) |
            HealthcareStaff.phone.ilike(search_lower) |
            HealthcareStaff.role.ilike(search_lower)
        )
    return query.count()


def create_healthcare_staff(staff_data: dict, db: Session) -> HealthcareStaff:
    db_staff = HealthcareStaff(**staff_data)
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff


def update_healthcare_staff(staff_id: str, update_data: dict, db: Session, tenant_id: Optional[str] = None) -> Optional[HealthcareStaff]:
    staff = get_healthcare_staff_by_id(staff_id, db, tenant_id)
    if not staff:
        return None
    for key, value in update_data.items():
        if hasattr(staff, key):
            setattr(staff, key, value)
    db.commit()
    db.refresh(staff)
    return staff


def get_patient_by_id(patient_id: str, db: Session, tenant_id: Optional[str] = None) -> Optional[Patient]:
    query = db.query(Patient).filter(Patient.id == patient_id)
    if tenant_id:
        query = query.filter(Patient.tenant_id == tenant_id)
    return query.first()


def get_patients(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 500,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[Patient]:
    query = db.query(Patient).filter(Patient.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Patient.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Patient.full_name.ilike(search_lower) |
            or_(Patient.phone.is_(None), Patient.phone.ilike(search_lower)) |
            or_(Patient.email.is_(None), Patient.email.ilike(search_lower))
        )
    return query.order_by(Patient.full_name.asc()).offset(skip).limit(limit).all()


def get_patients_count(
    db: Session,
    tenant_id: str,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> int:
    query = db.query(Patient).filter(Patient.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Patient.is_active == is_active)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Patient.full_name.ilike(search_lower) |
            or_(Patient.phone.is_(None), Patient.phone.ilike(search_lower)) |
            or_(Patient.email.is_(None), Patient.email.ilike(search_lower))
        )
    return query.count()


def create_patient(patient_data: dict, db: Session) -> Patient:
    db_patient = Patient(**patient_data)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


def update_patient(patient_id: str, update_data: dict, db: Session, tenant_id: Optional[str] = None) -> Optional[Patient]:
    patient = get_patient_by_id(patient_id, db, tenant_id)
    if not patient:
        return None
    for key, value in update_data.items():
        if hasattr(patient, key):
            setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    return patient


def delete_patient(patient_id: str, db: Session, tenant_id: Optional[str] = None) -> bool:
    patient = get_patient_by_id(patient_id, db, tenant_id)
    if patient:
        db.delete(patient)
        db.commit()
        return True
    return False


def get_appointment_by_id(appointment_id: str, db: Session, tenant_id: Optional[str] = None) -> Optional[Appointment]:
    query = db.query(Appointment).filter(Appointment.id == appointment_id)
    if tenant_id:
        query = query.filter(Appointment.tenant_id == tenant_id)
    return query.first()


def get_appointments(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 500,
    doctor_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> List[Appointment]:
    query = db.query(Appointment).filter(Appointment.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Appointment.is_active == is_active)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if date_from is not None:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to is not None:
        query = query.filter(Appointment.appointment_date <= date_to)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Appointment.patient_name.ilike(search_lower) |
            or_(Appointment.patient_phone.is_(None), Appointment.patient_phone.ilike(search_lower))
        )
    return query.order_by(Appointment.appointment_date.asc(), Appointment.start_time.asc()).offset(skip).limit(limit).all()


def get_appointments_count(
    db: Session,
    tenant_id: str,
    doctor_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> int:
    query = db.query(Appointment).filter(Appointment.tenant_id == tenant_id)
    if is_active is not None:
        query = query.filter(Appointment.is_active == is_active)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if date_from is not None:
        query = query.filter(Appointment.appointment_date >= date_from)
    if date_to is not None:
        query = query.filter(Appointment.appointment_date <= date_to)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            Appointment.patient_name.ilike(search_lower) |
            or_(Appointment.patient_phone.is_(None), Appointment.patient_phone.ilike(search_lower))
        )
    return query.count()


def create_appointment(appointment_data: dict, db: Session) -> Appointment:
    db_appointment = Appointment(**appointment_data)
    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)
    return db_appointment


def update_appointment(appointment_id: str, update_data: dict, db: Session, tenant_id: Optional[str] = None) -> Optional[Appointment]:
    appointment = get_appointment_by_id(appointment_id, db, tenant_id)
    if not appointment:
        return None
    for key, value in update_data.items():
        if hasattr(appointment, key):
            setattr(appointment, key, value)
    db.commit()
    db.refresh(appointment)
    return appointment


def delete_appointment(appointment_id: str, db: Session, tenant_id: Optional[str] = None) -> bool:
    appointment = get_appointment_by_id(appointment_id, db, tenant_id)
    if appointment:
        db.delete(appointment)
        db.commit()
        return True
    return False


def get_prescription_by_id(prescription_id: str, db: Session, tenant_id: Optional[str] = None) -> Optional[Prescription]:
    query = db.query(Prescription).filter(Prescription.id == prescription_id)
    if tenant_id:
        query = query.filter(Prescription.tenant_id == tenant_id)
    return query.first()


def get_prescriptions(
    db: Session,
    tenant_id: str,
    skip: int = 0,
    limit: int = 200,
    appointment_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Prescription]:
    query = db.query(Prescription).filter(Prescription.tenant_id == tenant_id)
    if appointment_id:
        query = query.filter(Prescription.appointment_id == appointment_id)
    if doctor_id:
        query = query.filter(Prescription.doctor_id == doctor_id)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(Prescription.patient_name.ilike(search_lower))
    return query.order_by(Prescription.prescription_date.desc(), Prescription.createdAt.desc()).offset(skip).limit(limit).all()


def get_prescriptions_count(
    db: Session,
    tenant_id: str,
    appointment_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    search: Optional[str] = None,
) -> int:
    query = db.query(Prescription).filter(Prescription.tenant_id == tenant_id)
    if appointment_id:
        query = query.filter(Prescription.appointment_id == appointment_id)
    if doctor_id:
        query = query.filter(Prescription.doctor_id == doctor_id)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(Prescription.patient_name.ilike(search_lower))
    return query.count()


def create_prescription(prescription_data: dict, db: Session) -> Prescription:
    db_prescription = Prescription(**prescription_data)
    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)
    return db_prescription


def update_prescription(prescription_id: str, update_data: dict, db: Session, tenant_id: Optional[str] = None) -> Optional[Prescription]:
    prescription = get_prescription_by_id(prescription_id, db, tenant_id)
    if not prescription:
        return None
    for key, value in update_data.items():
        if hasattr(prescription, key):
            setattr(prescription, key, value)
    db.commit()
    db.refresh(prescription)
    return prescription


def delete_prescription(prescription_id: str, db: Session, tenant_id: Optional[str] = None) -> bool:
    prescription = get_prescription_by_id(prescription_id, db, tenant_id)
    if prescription:
        db.delete(prescription)
        db.commit()
        return True
    return False
