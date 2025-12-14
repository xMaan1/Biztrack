import uuid
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from sqlalchemy.exc import IntegrityError
from .lab_report_models import LabReport
from .patient_models import Patient

def create_lab_report(db: Session, lab_report_data: Dict[str, Any], tenant_id: str) -> LabReport:
    try:
        lab_report_data["tenant_id"] = tenant_id
        lab_report_data["createdAt"] = datetime.utcnow()
        lab_report_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['testCategory', 'labName', 'labAddress', 'technicianName', 'notes', 'appointment_id']
        for field in optional_fields:
            if field in lab_report_data and lab_report_data[field] == '':
                lab_report_data[field] = None
        
        uuid_fields = ['appointment_id', 'verifiedBy']
        for field in uuid_fields:
            if field in lab_report_data and lab_report_data[field] is None:
                del lab_report_data[field]
        
        if not lab_report_data.get('testResults'):
            lab_report_data['testResults'] = []
        if not lab_report_data.get('attachments'):
            lab_report_data['attachments'] = []
        
        if lab_report_data.get('isVerified') is None:
            lab_report_data['isVerified'] = False
        
        lab_report = LabReport(**lab_report_data)
        db.add(lab_report)
        db.commit()
        db.refresh(lab_report)
        return lab_report
        
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database constraint violation: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise

def get_lab_report_by_id(db: Session, lab_report_id: str, tenant_id: str) -> Optional[LabReport]:
    return db.query(LabReport).filter(
        and_(LabReport.id == lab_report_id, LabReport.tenant_id == tenant_id)
    ).first()

def get_lab_reports(
    db: Session, 
    tenant_id: str, 
    skip: int = 0, 
    limit: int = 100,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    test_category: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    is_verified: Optional[bool] = None
) -> tuple[List[LabReport], int]:
    query = db.query(LabReport).filter(LabReport.tenant_id == tenant_id)
    
    if patient_id:
        query = query.filter(LabReport.patient_id == patient_id)
    
    if doctor_id:
        query = query.filter(LabReport.orderedBy == doctor_id)
    
    if test_category:
        query = query.filter(LabReport.testCategory == test_category)
    
    if date_from:
        query = query.filter(LabReport.reportDate >= date_from)
    
    if date_to:
        query = query.filter(LabReport.reportDate <= date_to)
    
    if is_verified is not None:
        query = query.filter(LabReport.isVerified == is_verified)
    
    total = query.count()
    lab_reports = query.order_by(desc(LabReport.reportDate)).offset(skip).limit(limit).all()
    return lab_reports, total

def update_lab_report(db: Session, lab_report_id: str, lab_report_data: Dict[str, Any], tenant_id: str) -> Optional[LabReport]:
    try:
        lab_report = get_lab_report_by_id(db, lab_report_id, tenant_id)
        if not lab_report:
            return None
        
        lab_report_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['testCategory', 'labName', 'labAddress', 'technicianName', 'notes', 'appointment_id']
        for field in optional_fields:
            if field in lab_report_data and lab_report_data[field] == '':
                lab_report_data[field] = None
        
        uuid_fields = ['appointment_id', 'verifiedBy']
        for field in uuid_fields:
            if field in lab_report_data and lab_report_data[field] is None and field != 'verifiedBy':
                del lab_report_data[field]
        
        for key, value in lab_report_data.items():
            if hasattr(lab_report, key):
                setattr(lab_report, key, value)
        
        db.commit()
        db.refresh(lab_report)
        return lab_report
        
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database constraint violation: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise

def delete_lab_report(db: Session, lab_report_id: str, tenant_id: str) -> bool:
    lab_report = get_lab_report_by_id(db, lab_report_id, tenant_id)
    if not lab_report:
        return False
    
    db.delete(lab_report)
    db.commit()
    return True

def verify_lab_report(db: Session, lab_report_id: str, verified_by: str, tenant_id: str) -> Optional[LabReport]:
    try:
        lab_report = get_lab_report_by_id(db, lab_report_id, tenant_id)
        if not lab_report:
            return None
        
        lab_report.isVerified = True
        lab_report.verifiedBy = verified_by
        lab_report.verifiedAt = datetime.utcnow()
        lab_report.updatedAt = datetime.utcnow()
        
        db.commit()
        db.refresh(lab_report)
        return lab_report
        
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database constraint violation: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise

def get_lab_report_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    total_reports = db.query(LabReport).filter(LabReport.tenant_id == tenant_id).count()
    
    verified = db.query(LabReport).filter(
        LabReport.tenant_id == tenant_id,
        LabReport.isVerified == True
    ).count()
    
    unverified = db.query(LabReport).filter(
        LabReport.tenant_id == tenant_id,
        LabReport.isVerified == False
    ).count()
    
    today = date.today()
    today_reports = db.query(LabReport).filter(
        LabReport.tenant_id == tenant_id,
        LabReport.reportDate == today
    ).count()
    
    test_categories = db.query(
        LabReport.testCategory,
        func.count(LabReport.id).label('count')
    ).filter(
        LabReport.tenant_id == tenant_id,
        LabReport.testCategory.isnot(None)
    ).group_by(LabReport.testCategory).all()
    
    category_counts = {category: count for category, count in test_categories if category}
    
    return {
        "total": total_reports,
        "verified": verified,
        "unverified": unverified,
        "today": today_reports,
        "byCategory": category_counts
    }

