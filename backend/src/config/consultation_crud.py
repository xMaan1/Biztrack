import uuid
from datetime import datetime, date, time
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from sqlalchemy.exc import IntegrityError
from .consultation_models import Consultation
from .patient_models import Patient

def create_consultation(db: Session, consultation_data: Dict[str, Any], tenant_id: str) -> Consultation:
    try:
        consultation_data["tenant_id"] = tenant_id
        consultation_data["createdAt"] = datetime.utcnow()
        consultation_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['chiefComplaint', 'historyOfPresentIllness', 'physicalExamination', 'assessment', 'plan', 'followUpNotes', 'appointment_id']
        for field in optional_fields:
            if field in consultation_data and consultation_data[field] == '':
                consultation_data[field] = None
        
        uuid_fields = ['appointment_id']
        for field in uuid_fields:
            if field in consultation_data and consultation_data[field] is None:
                del consultation_data[field]
        
        if isinstance(consultation_data.get('consultationTime'), str):
            time_parts = consultation_data['consultationTime'].split(':')
            consultation_data['consultationTime'] = time(int(time_parts[0]), int(time_parts[1]))
        
        if not consultation_data.get('prescriptions'):
            consultation_data['prescriptions'] = []
        if not consultation_data.get('vitalSigns'):
            consultation_data['vitalSigns'] = {}
        
        consultation = Consultation(**consultation_data)
        db.add(consultation)
        db.commit()
        db.refresh(consultation)
        return consultation
        
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database constraint violation: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise

def get_consultation_by_id(db: Session, consultation_id: str, tenant_id: str) -> Optional[Consultation]:
    return db.query(Consultation).filter(
        and_(Consultation.id == consultation_id, Consultation.tenant_id == tenant_id)
    ).first()

def get_consultations(
    db: Session, 
    tenant_id: str, 
    skip: int = 0, 
    limit: int = 100,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
) -> tuple[List[Consultation], int]:
    query = db.query(Consultation).filter(Consultation.tenant_id == tenant_id)
    
    if patient_id:
        query = query.filter(Consultation.patient_id == patient_id)
    
    if doctor_id:
        query = query.filter(Consultation.doctorId == doctor_id)
    
    if date_from:
        query = query.filter(Consultation.consultationDate >= date_from)
    
    if date_to:
        query = query.filter(Consultation.consultationDate <= date_to)
    
    total = query.count()
    consultations = query.order_by(desc(Consultation.consultationDate), Consultation.consultationTime).offset(skip).limit(limit).all()
    return consultations, total

def update_consultation(db: Session, consultation_id: str, consultation_data: Dict[str, Any], tenant_id: str) -> Optional[Consultation]:
    try:
        consultation = get_consultation_by_id(db, consultation_id, tenant_id)
        if not consultation:
            return None
        
        consultation_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['chiefComplaint', 'historyOfPresentIllness', 'physicalExamination', 'assessment', 'plan', 'followUpNotes', 'appointment_id']
        for field in optional_fields:
            if field in consultation_data and consultation_data[field] == '':
                consultation_data[field] = None
        
        uuid_fields = ['appointment_id']
        for field in uuid_fields:
            if field in consultation_data and consultation_data[field] is None:
                del consultation_data[field]
        
        if isinstance(consultation_data.get('consultationTime'), str):
            time_parts = consultation_data['consultationTime'].split(':')
            consultation_data['consultationTime'] = time(int(time_parts[0]), int(time_parts[1]))
        
        for key, value in consultation_data.items():
            if hasattr(consultation, key):
                setattr(consultation, key, value)
        
        db.commit()
        db.refresh(consultation)
        return consultation
        
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database constraint violation: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise

def delete_consultation(db: Session, consultation_id: str, tenant_id: str) -> bool:
    consultation = get_consultation_by_id(db, consultation_id, tenant_id)
    if not consultation:
        return False
    
    db.delete(consultation)
    db.commit()
    return True

def get_consultation_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    total_consultations = db.query(Consultation).filter(Consultation.tenant_id == tenant_id).count()
    
    today = date.today()
    today_consultations = db.query(Consultation).filter(
        Consultation.tenant_id == tenant_id,
        Consultation.consultationDate == today
    ).count()
    
    this_month = db.query(Consultation).filter(
        Consultation.tenant_id == tenant_id,
        func.date_trunc('month', Consultation.consultationDate) == func.date_trunc('month', today)
    ).count()
    
    return {
        "total": total_consultations,
        "today": today_consultations,
        "thisMonth": this_month
    }

