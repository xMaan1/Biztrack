import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from sqlalchemy.exc import IntegrityError
from .patient_models import Patient
from .core_models import User

def generate_patient_id(db: Session, tenant_id: str) -> str:
    last_patient = db.query(Patient).filter(
        Patient.tenant_id == tenant_id
    ).order_by(desc(Patient.patientId)).first()
    
    if last_patient and last_patient.patientId:
        try:
            last_number = int(last_patient.patientId.replace("PAT", ""))
            new_number = last_number + 1
        except ValueError:
            new_number = 1
    else:
        new_number = 1
    
    return f"PAT{new_number:06d}"

def create_patient(db: Session, patient_data: Dict[str, Any], tenant_id: str) -> Patient:
    try:
        patient_data["patientId"] = generate_patient_id(db, tenant_id)
        patient_data["tenant_id"] = tenant_id
        patient_data["createdAt"] = datetime.utcnow()
        patient_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['email', 'phone', 'mobile', 'address', 'city', 'state', 'postalCode', 'notes',
                          'bloodGroup', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
                          'insuranceProvider', 'insurancePolicyNumber']
        for field in optional_fields:
            if field in patient_data and patient_data[field] == '':
                patient_data[field] = None
        
        uuid_fields = ['assignedToId']
        for field in uuid_fields:
            if field in patient_data and patient_data[field] is None:
                del patient_data[field]
        
        if not patient_data.get('allergies'):
            patient_data['allergies'] = []
        if not patient_data.get('chronicConditions'):
            patient_data['chronicConditions'] = []
        if not patient_data.get('medications'):
            patient_data['medications'] = []
        
        patient = Patient(**patient_data)
        db.add(patient)
        db.commit()
        db.refresh(patient)
        return patient
        
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig)
        if "patientid" in error_msg.lower():
            raise ValueError("Patient with this ID already exists")
        else:
            raise ValueError(f"Database constraint violation: {error_msg}")
    except Exception as e:
        db.rollback()
        raise

def get_patient_by_id(db: Session, patient_id: str, tenant_id: str) -> Optional[Patient]:
    return db.query(Patient).filter(
        and_(Patient.id == patient_id, Patient.tenant_id == tenant_id)
    ).first()

def get_patients(
    db: Session, 
    tenant_id: str, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None
) -> tuple[List[Patient], int]:
    query = db.query(Patient).filter(Patient.tenant_id == tenant_id)
    
    if search:
        normalized_search = ' '.join(search.split())
        search_filter = or_(
            func.regexp_replace(Patient.firstName, r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
            func.regexp_replace(Patient.lastName, r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
            func.regexp_replace(func.concat(Patient.firstName, ' ', Patient.lastName), r'\s+', ' ', 'g').ilike(f"%{normalized_search}%"),
            Patient.patientId.ilike(f"%{normalized_search}%"),
            Patient.phone.ilike(f"%{normalized_search}%"),
            Patient.mobile.ilike(f"%{normalized_search}%"),
            Patient.email.ilike(f"%{normalized_search}%")
        )
        query = query.filter(search_filter)
    
    if status:
        query = query.filter(Patient.status == status)
    
    total = query.count()
    patients = query.order_by(desc(Patient.createdAt)).offset(skip).limit(limit).all()
    return patients, total

def update_patient(db: Session, patient_id: str, patient_data: Dict[str, Any], tenant_id: str) -> Optional[Patient]:
    try:
        patient = get_patient_by_id(db, patient_id, tenant_id)
        if not patient:
            return None
        
        patient_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['email', 'phone', 'mobile', 'address', 'city', 'state', 'postalCode', 'notes',
                          'bloodGroup', 'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
                          'insuranceProvider', 'insurancePolicyNumber']
        for field in optional_fields:
            if field in patient_data and patient_data[field] == '':
                patient_data[field] = None
        
        uuid_fields = ['assignedToId']
        for field in uuid_fields:
            if field in patient_data and patient_data[field] is None:
                del patient_data[field]
        
        for key, value in patient_data.items():
            if hasattr(patient, key):
                setattr(patient, key, value)
        
        db.commit()
        db.refresh(patient)
        return patient
        
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database constraint violation: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise

def delete_patient(db: Session, patient_id: str, tenant_id: str) -> bool:
    patient = get_patient_by_id(db, patient_id, tenant_id)
    if not patient:
        return False
    
    db.delete(patient)
    db.commit()
    return True

def get_patient_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    total_patients = db.query(Patient).filter(Patient.tenant_id == tenant_id).count()
    active_patients = db.query(Patient).filter(
        Patient.tenant_id == tenant_id,
        Patient.status == "active"
    ).count()
    inactive_patients = db.query(Patient).filter(
        Patient.tenant_id == tenant_id,
        Patient.status == "inactive"
    ).count()
    
    return {
        "total": total_patients,
        "active": active_patients,
        "inactive": inactive_patients
    }

