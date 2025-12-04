import uuid
from datetime import datetime, date, time
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from sqlalchemy.exc import IntegrityError
from .appointment_models import Appointment
from .patient_models import Patient

def create_appointment(db: Session, appointment_data: Dict[str, Any], tenant_id: str) -> Appointment:
    try:
        appointment_data["tenant_id"] = tenant_id
        appointment_data["createdAt"] = datetime.utcnow()
        appointment_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['reason', 'notes', 'doctorId']
        for field in optional_fields:
            if field in appointment_data and appointment_data[field] == '':
                appointment_data[field] = None
        
        uuid_fields = ['doctorId']
        for field in uuid_fields:
            if field in appointment_data and appointment_data[field] is None:
                del appointment_data[field]
        
        if isinstance(appointment_data.get('appointmentTime'), str):
            time_parts = appointment_data['appointmentTime'].split(':')
            appointment_data['appointmentTime'] = time(int(time_parts[0]), int(time_parts[1]))
        
        appointment = Appointment(**appointment_data)
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        return appointment
        
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database constraint violation: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise

def get_appointment_by_id(db: Session, appointment_id: str, tenant_id: str) -> Optional[Appointment]:
    return db.query(Appointment).filter(
        and_(Appointment.id == appointment_id, Appointment.tenant_id == tenant_id)
    ).first()

def get_appointments(
    db: Session, 
    tenant_id: str, 
    skip: int = 0, 
    limit: int = 100,
    patient_id: Optional[str] = None,
    doctor_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None
) -> tuple[List[Appointment], int]:
    query = db.query(Appointment).filter(Appointment.tenant_id == tenant_id)
    
    if patient_id:
        query = query.filter(Appointment.patient_id == patient_id)
    
    if doctor_id:
        query = query.filter(Appointment.doctorId == doctor_id)
    
    if status:
        query = query.filter(Appointment.status == status)
    
    if date_from:
        query = query.filter(Appointment.appointmentDate >= date_from)
    
    if date_to:
        query = query.filter(Appointment.appointmentDate <= date_to)
    
    total = query.count()
    appointments = query.order_by(Appointment.appointmentDate, Appointment.appointmentTime).offset(skip).limit(limit).all()
    return appointments, total

def update_appointment(db: Session, appointment_id: str, appointment_data: Dict[str, Any], tenant_id: str) -> Optional[Appointment]:
    try:
        appointment = get_appointment_by_id(db, appointment_id, tenant_id)
        if not appointment:
            return None
        
        appointment_data["updatedAt"] = datetime.utcnow()
        
        optional_fields = ['reason', 'notes', 'doctorId']
        for field in optional_fields:
            if field in appointment_data and appointment_data[field] == '':
                appointment_data[field] = None
        
        uuid_fields = ['doctorId']
        for field in uuid_fields:
            if field in appointment_data and appointment_data[field] is None:
                del appointment_data[field]
        
        if isinstance(appointment_data.get('appointmentTime'), str):
            time_parts = appointment_data['appointmentTime'].split(':')
            appointment_data['appointmentTime'] = time(int(time_parts[0]), int(time_parts[1]))
        
        for key, value in appointment_data.items():
            if hasattr(appointment, key):
                setattr(appointment, key, value)
        
        db.commit()
        db.refresh(appointment)
        return appointment
        
    except IntegrityError as e:
        db.rollback()
        raise ValueError(f"Database constraint violation: {str(e.orig)}")
    except Exception as e:
        db.rollback()
        raise

def delete_appointment(db: Session, appointment_id: str, tenant_id: str) -> bool:
    appointment = get_appointment_by_id(db, appointment_id, tenant_id)
    if not appointment:
        return False
    
    db.delete(appointment)
    db.commit()
    return True

def get_appointment_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    total_appointments = db.query(Appointment).filter(Appointment.tenant_id == tenant_id).count()
    scheduled = db.query(Appointment).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.status == "scheduled"
    ).count()
    completed = db.query(Appointment).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.status == "completed"
    ).count()
    cancelled = db.query(Appointment).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.status == "cancelled"
    ).count()
    
    today = date.today()
    today_appointments = db.query(Appointment).filter(
        Appointment.tenant_id == tenant_id,
        Appointment.appointmentDate == today
    ).count()
    
    return {
        "total": total_appointments,
        "scheduled": scheduled,
        "completed": completed,
        "cancelled": cancelled,
        "today": today_appointments
    }

