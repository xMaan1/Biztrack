import uuid
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from sqlalchemy.exc import IntegrityError
from .medical_record_models import MedicalRecord
from .patient_models import Patient

def create_medical_record(db: Session, record_data: Dict[str, Any], tenant_id: str) -> MedicalRecord:
    try:
        record_data["tenant_id"] = tenant_id
        record_data["createdAt"] = datetime.utcnow()
        record_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['description', 'diagnosis', 'treatment', 'notes', 'doctorId']
        for field in optional_fields:
            if field in record_data and record_data[field] == '':
                record_data[field] = None
        
        uuid_fields = ['doctorId']
        for field in uuid_fields:
            if field in record_data and record_data[field] is None:
                del record_data[field]
        
        if not record_data.get('medications'):
            record_data['medications'] = []
        if not record_data.get('vitalSigns'):
            record_data['vitalSigns'] = {}
        if not record_data.get('labResults'):
            record_data['labResults'] = {}
        if not record_data.get('attachments'):
            record_data['attachments'] = []
        
        record = MedicalRecord(**record_data)
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
        
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database constraint violation: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise

def get_medical_record_by_id(db: Session, record_id: str, tenant_id: str) -> Optional[MedicalRecord]:
    return db.query(MedicalRecord).filter(
        and_(MedicalRecord.id == record_id, MedicalRecord.tenant_id == tenant_id)
    ).first()

def get_medical_records(
    db: Session, 
    tenant_id: str, 
    skip: int = 0, 
    limit: int = 100,
    patient_id: Optional[str] = None,
    record_type: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
) -> tuple[List[MedicalRecord], int]:
    query = db.query(MedicalRecord).filter(MedicalRecord.tenant_id == tenant_id)
    
    if patient_id:
        query = query.filter(MedicalRecord.patient_id == patient_id)
    
    if record_type:
        query = query.filter(MedicalRecord.recordType == record_type)
    
    if doctor_id:
        query = query.filter(MedicalRecord.doctorId == doctor_id)
    
    if date_from:
        query = query.filter(MedicalRecord.visitDate >= date_from)
    
    if date_to:
        query = query.filter(MedicalRecord.visitDate <= date_to)
    
    total = query.count()
    records = query.order_by(desc(MedicalRecord.visitDate)).offset(skip).limit(limit).all()
    return records, total

def update_medical_record(db: Session, record_id: str, record_data: Dict[str, Any], tenant_id: str) -> Optional[MedicalRecord]:
    try:
        record = get_medical_record_by_id(db, record_id, tenant_id)
        if not record:
            return None
        
        record_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['description', 'diagnosis', 'treatment', 'notes', 'doctorId']
        for field in optional_fields:
            if field in record_data and record_data[field] == '':
                record_data[field] = None
        
        uuid_fields = ['doctorId']
        for field in uuid_fields:
            if field in record_data and record_data[field] is None:
                del record_data[field]
        
        for key, value in record_data.items():
            if hasattr(record, key):
                setattr(record, key, value)
        
        db.commit()
        db.refresh(record)
        return record
        
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database constraint violation: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise

def delete_medical_record(db: Session, record_id: str, tenant_id: str) -> bool:
    record = get_medical_record_by_id(db, record_id, tenant_id)
    if not record:
        return False
    
    db.delete(record)
    db.commit()
    return True

def get_medical_record_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    total_records = db.query(MedicalRecord).filter(MedicalRecord.tenant_id == tenant_id).count()
    
    record_types = db.query(
        MedicalRecord.recordType,
        func.count(MedicalRecord.id).label('count')
    ).filter(
        MedicalRecord.tenant_id == tenant_id
    ).group_by(MedicalRecord.recordType).all()
    
    type_counts = {record_type: count for record_type, count in record_types}
    
    return {
        "total": total_records,
        "byType": type_counts
    }

