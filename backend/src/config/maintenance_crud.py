from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
from .maintenance_models import MaintenanceSchedule, MaintenanceWorkOrder, Equipment, MaintenanceReport
from .database_config import get_db

# Maintenance Schedule CRUD
def create_maintenance_schedule(db: Session, schedule_data: dict, tenant_id: str, created_by_id: str) -> MaintenanceSchedule:
    schedule = MaintenanceSchedule(
        **schedule_data,
        tenant_id=tenant_id,
        created_by_id=created_by_id
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule

def get_maintenance_schedule_by_id(db: Session, schedule_id: str, tenant_id: str) -> Optional[MaintenanceSchedule]:
    return db.query(MaintenanceSchedule).filter(
        and_(MaintenanceSchedule.id == schedule_id, MaintenanceSchedule.tenant_id == tenant_id)
    ).first()

def get_all_maintenance_schedules(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[MaintenanceSchedule]:
    return db.query(MaintenanceSchedule).filter(
        MaintenanceSchedule.tenant_id == tenant_id
    ).offset(skip).limit(limit).all()

def get_maintenance_schedules_by_status(db: Session, status: str, tenant_id: str) -> List[MaintenanceSchedule]:
    return db.query(MaintenanceSchedule).filter(
        and_(MaintenanceSchedule.maintenance_type == status, MaintenanceSchedule.tenant_id == tenant_id)
    ).all()

def get_maintenance_schedules_by_priority(db: Session, priority: str, tenant_id: str) -> List[MaintenanceSchedule]:
    return db.query(MaintenanceSchedule).filter(
        and_(MaintenanceSchedule.priority == priority, MaintenanceSchedule.tenant_id == tenant_id)
    ).all()

def get_maintenance_schedules_by_equipment(db: Session, equipment_id: str, tenant_id: str) -> List[MaintenanceSchedule]:
    return db.query(MaintenanceSchedule).filter(
        and_(MaintenanceSchedule.equipment_id == equipment_id, MaintenanceSchedule.tenant_id == tenant_id)
    ).all()

def get_maintenance_schedules_by_technician(db: Session, technician_id: str, tenant_id: str) -> List[MaintenanceSchedule]:
    return db.query(MaintenanceSchedule).filter(
        and_(MaintenanceSchedule.assigned_technician_id == technician_id, MaintenanceSchedule.tenant_id == tenant_id)
    ).all()

def update_maintenance_schedule(db: Session, schedule_id: str, update_data: dict, tenant_id: str, updated_by_id: str) -> Optional[MaintenanceSchedule]:
    schedule = get_maintenance_schedule_by_id(db, schedule_id, tenant_id)
    if schedule:
        for key, value in update_data.items():
            if hasattr(schedule, key):
                setattr(schedule, key, value)
        schedule.updated_by_id = updated_by_id
        schedule.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(schedule)
    return schedule

def delete_maintenance_schedule(db: Session, schedule_id: str, tenant_id: str) -> bool:
    schedule = get_maintenance_schedule_by_id(db, schedule_id, tenant_id)
    if schedule:
        db.delete(schedule)
        db.commit()
        return True
    return False

# Maintenance Work Order CRUD
def create_maintenance_work_order(db: Session, work_order_data: dict, tenant_id: str, created_by_id: str) -> MaintenanceWorkOrder:
    work_order = MaintenanceWorkOrder(
        **work_order_data,
        tenant_id=tenant_id,
        created_by_id=created_by_id
    )
    db.add(work_order)
    db.commit()
    db.refresh(work_order)
    return work_order

def get_maintenance_work_order_by_id(db: Session, work_order_id: str, tenant_id: str) -> Optional[MaintenanceWorkOrder]:
    return db.query(MaintenanceWorkOrder).filter(
        and_(MaintenanceWorkOrder.id == work_order_id, MaintenanceWorkOrder.tenant_id == tenant_id)
    ).first()

def get_all_maintenance_work_orders(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[MaintenanceWorkOrder]:
    return db.query(MaintenanceWorkOrder).filter(
        MaintenanceWorkOrder.tenant_id == tenant_id
    ).offset(skip).limit(limit).all()

def get_maintenance_work_orders_by_status(db: Session, status: str, tenant_id: str) -> List[MaintenanceWorkOrder]:
    return db.query(MaintenanceWorkOrder).filter(
        and_(MaintenanceWorkOrder.status == status, MaintenanceWorkOrder.tenant_id == tenant_id)
    ).all()

def get_maintenance_work_orders_by_technician(db: Session, technician_id: str, tenant_id: str) -> List[MaintenanceWorkOrder]:
    return db.query(MaintenanceWorkOrder).filter(
        and_(MaintenanceWorkOrder.technician_id == technician_id, MaintenanceWorkOrder.tenant_id == tenant_id)
    ).all()

def update_maintenance_work_order(db: Session, work_order_id: str, update_data: dict, tenant_id: str, updated_by_id: str) -> Optional[MaintenanceWorkOrder]:
    work_order = get_maintenance_work_order_by_id(db, work_order_id, tenant_id)
    if work_order:
        for key, value in update_data.items():
            if hasattr(work_order, key):
                setattr(work_order, key, value)
        work_order.updated_by_id = updated_by_id
        work_order.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(work_order)
    return work_order

def delete_maintenance_work_order(db: Session, work_order_id: str, tenant_id: str) -> bool:
    work_order = get_maintenance_work_order_by_id(db, work_order_id, tenant_id)
    if work_order:
        db.delete(work_order)
        db.commit()
        return True
    return False

# Equipment CRUD
def create_equipment(db: Session, equipment_data: dict, tenant_id: str, created_by_id: str) -> Equipment:
    equipment = Equipment(
        **equipment_data,
        tenant_id=tenant_id,
        created_by_id=created_by_id
    )
    db.add(equipment)
    db.commit()
    db.refresh(equipment)
    return equipment

def get_equipment_by_id(db: Session, equipment_id: str, tenant_id: str) -> Optional[Equipment]:
    return db.query(Equipment).filter(
        and_(Equipment.id == equipment_id, Equipment.tenant_id == tenant_id)
    ).first()

def get_all_equipment(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[Equipment]:
    return db.query(Equipment).filter(
        Equipment.tenant_id == tenant_id
    ).offset(skip).limit(limit).all()

def get_equipment_by_status(db: Session, status: str, tenant_id: str) -> List[Equipment]:
    return db.query(Equipment).filter(
        and_(Equipment.status == status, Equipment.tenant_id == tenant_id)
    ).all()

def get_equipment_by_category(db: Session, category: str, tenant_id: str) -> List[Equipment]:
    return db.query(Equipment).filter(
        and_(Equipment.category == category, Equipment.tenant_id == tenant_id)
    ).all()

def get_equipment_by_location(db: Session, location: str, tenant_id: str) -> List[Equipment]:
    return db.query(Equipment).filter(
        and_(Equipment.location == location, Equipment.tenant_id == tenant_id)
    ).all()

def update_equipment(db: Session, equipment_id: str, update_data: dict, tenant_id: str, updated_by_id: str) -> Optional[Equipment]:
    equipment = get_equipment_by_id(db, equipment_id, tenant_id)
    if equipment:
        for key, value in update_data.items():
            if hasattr(equipment, key):
                setattr(equipment, key, value)
        equipment.updated_by_id = updated_by_id
        equipment.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(equipment)
    return equipment

def delete_equipment(db: Session, equipment_id: str, tenant_id: str) -> bool:
    equipment = get_equipment_by_id(db, equipment_id, tenant_id)
    if equipment:
        db.delete(equipment)
        db.commit()
        return True
    return False

# Maintenance Report CRUD
def create_maintenance_report(db: Session, report_data: dict, tenant_id: str, created_by_id: str) -> MaintenanceReport:
    report = MaintenanceReport(
        **report_data,
        tenant_id=tenant_id,
        created_by_id=created_by_id
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

def get_maintenance_report_by_id(db: Session, report_id: str, tenant_id: str) -> Optional[MaintenanceReport]:
    return db.query(MaintenanceReport).filter(
        and_(MaintenanceReport.id == report_id, MaintenanceReport.tenant_id == tenant_id)
    ).first()

def get_all_maintenance_reports(db: Session, tenant_id: str, skip: int = 0, limit: int = 100) -> List[MaintenanceReport]:
    return db.query(MaintenanceReport).filter(
        MaintenanceReport.tenant_id == tenant_id
    ).offset(skip).limit(limit).all()

def get_maintenance_reports_by_equipment(db: Session, equipment_id: str, tenant_id: str) -> List[MaintenanceReport]:
    return db.query(MaintenanceReport).filter(
        and_(MaintenanceReport.equipment_id == equipment_id, MaintenanceReport.tenant_id == tenant_id)
    ).all()

def get_maintenance_reports_by_technician(db: Session, technician_id: str, tenant_id: str) -> List[MaintenanceReport]:
    return db.query(MaintenanceReport).filter(
        and_(MaintenanceReport.technician_id == technician_id, MaintenanceReport.tenant_id == tenant_id)
    ).all()

def update_maintenance_report(db: Session, report_id: str, update_data: dict, tenant_id: str, updated_by_id: str) -> Optional[MaintenanceReport]:
    report = get_maintenance_report_by_id(db, report_id, tenant_id)
    if report:
        for key, value in update_data.items():
            if hasattr(report, key):
                setattr(report, key, value)
        report.updated_by_id = updated_by_id
        report.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(report)
    return report

def delete_maintenance_report(db: Session, report_id: str, tenant_id: str) -> bool:
    report = get_maintenance_report_by_id(db, report_id, tenant_id)
    if report:
        db.delete(report)
        db.commit()
        return True
    return False

# Dashboard and Statistics Functions
def get_maintenance_dashboard_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get maintenance dashboard statistics"""
    total_equipment = db.query(Equipment).filter(Equipment.tenant_id == tenant_id).count()
    
    operational_equipment = db.query(Equipment).filter(
        and_(Equipment.tenant_id == tenant_id, Equipment.status == "operational")
    ).count()
    
    maintenance_equipment = db.query(Equipment).filter(
        and_(Equipment.tenant_id == tenant_id, Equipment.status == "maintenance")
    ).count()
    
    overdue_maintenance = db.query(MaintenanceSchedule).filter(
        and_(
            MaintenanceSchedule.tenant_id == tenant_id,
            MaintenanceSchedule.scheduled_date < datetime.utcnow(),
            MaintenanceSchedule.maintenance_type.in_(["scheduled", "in_progress"])
        )
    ).count()
    
    scheduled_maintenance = db.query(MaintenanceSchedule).filter(
        and_(
            MaintenanceSchedule.tenant_id == tenant_id,
            MaintenanceSchedule.scheduled_date >= datetime.utcnow()
        )
    ).count()
    
    completed_maintenance = db.query(MaintenanceWorkOrder).filter(
        and_(MaintenanceWorkOrder.tenant_id == tenant_id, MaintenanceWorkOrder.status == "completed")
    ).count()
    
    total_cost = db.query(func.sum(MaintenanceReport.total_cost)).filter(
        MaintenanceReport.tenant_id == tenant_id
    ).scalar() or 0.0
    
    # Calculate efficiency score based on completed vs scheduled maintenance
    efficiency_score = 0.0
    if scheduled_maintenance > 0:
        efficiency_score = (completed_maintenance / scheduled_maintenance) * 100
    
    # Calculate uptime percentage
    uptime_percentage = 0.0
    if total_equipment > 0:
        uptime_percentage = (operational_equipment / total_equipment) * 100
    
    return {
        "total_equipment": total_equipment,
        "operational_equipment": operational_equipment,
        "maintenance_equipment": maintenance_equipment,
        "overdue_maintenance": overdue_maintenance,
        "scheduled_maintenance": scheduled_maintenance,
        "completed_maintenance": completed_maintenance,
        "total_cost": total_cost,
        "efficiency_score": round(efficiency_score, 2),
        "uptime_percentage": round(uptime_percentage, 2)
    }

def get_recent_maintenance_schedules(db: Session, tenant_id: str, limit: int = 5) -> List[MaintenanceSchedule]:
    """Get recent maintenance schedules"""
    return db.query(MaintenanceSchedule).filter(
        MaintenanceSchedule.tenant_id == tenant_id
    ).order_by(desc(MaintenanceSchedule.scheduled_date)).limit(limit).all()

def get_upcoming_maintenance(db: Session, tenant_id: str, limit: int = 5) -> List[MaintenanceSchedule]:
    """Get upcoming maintenance schedules"""
    return db.query(MaintenanceSchedule).filter(
        and_(
            MaintenanceSchedule.tenant_id == tenant_id,
            MaintenanceSchedule.scheduled_date >= datetime.utcnow()
        )
    ).order_by(MaintenanceSchedule.scheduled_date).limit(limit).all()

def get_critical_maintenance(db: Session, tenant_id: str, limit: int = 5) -> List[MaintenanceSchedule]:
    """Get critical priority maintenance schedules"""
    return db.query(MaintenanceSchedule).filter(
        and_(
            MaintenanceSchedule.tenant_id == tenant_id,
            MaintenanceSchedule.priority.in_(["critical", "emergency"])
        )
    ).order_by(MaintenanceSchedule.scheduled_date).limit(limit).all()

def get_equipment_maintenance_history(db: Session, equipment_id: str, tenant_id: str, limit: int = 10) -> List[MaintenanceReport]:
    """Get maintenance history for specific equipment"""
    return db.query(MaintenanceReport).filter(
        and_(MaintenanceReport.equipment_id == equipment_id, MaintenanceReport.tenant_id == tenant_id)
    ).order_by(desc(MaintenanceReport.report_date)).limit(limit).all()
