from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from .workshop_models import WorkOrder, WorkOrderTask, WorkOrderStatus, WorkOrderPriority, WorkOrderType

# Work Order functions
def get_work_order_by_id(work_order_id: str, db: Session, tenant_id: str = None) -> Optional[WorkOrder]:
    query = db.query(WorkOrder).filter(WorkOrder.id == work_order_id)
    if tenant_id:
        query = query.filter(WorkOrder.tenant_id == tenant_id)
    return query.first()

def get_all_work_orders(db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[WorkOrder]:
    query = db.query(WorkOrder).filter(WorkOrder.is_active == True)
    if tenant_id:
        query = query.filter(WorkOrder.tenant_id == tenant_id)
    return query.order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()

def get_work_orders_by_status(status: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[WorkOrder]:
    query = db.query(WorkOrder).filter(WorkOrder.status == status, WorkOrder.is_active == True)
    if tenant_id:
        query = query.filter(WorkOrder.tenant_id == tenant_id)
    return query.order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()

def get_work_orders_by_type(work_order_type: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[WorkOrder]:
    query = db.query(WorkOrder).filter(WorkOrder.work_order_type == work_order_type, WorkOrder.is_active == True)
    if tenant_id:
        query = query.filter(WorkOrder.tenant_id == tenant_id)
    return query.order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()

def get_work_orders_by_assigned_user(user_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[WorkOrder]:
    query = db.query(WorkOrder).filter(WorkOrder.assigned_to_id == user_id, WorkOrder.is_active == True)
    if tenant_id:
        query = query.filter(WorkOrder.tenant_id == tenant_id)
    return query.order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()

def get_work_orders_by_project(project_id: str, db: Session, tenant_id: str = None, skip: int = 0, limit: int = 100) -> List[WorkOrder]:
    query = db.query(WorkOrder).filter(WorkOrder.project_id == project_id, WorkOrder.is_active == True)
    if tenant_id:
        query = query.filter(WorkOrder.tenant_id == tenant_id)
    return query.order_by(WorkOrder.created_at.desc()).offset(skip).limit(limit).all()

def create_work_order(work_order_data: dict, db: Session) -> WorkOrder:
    db_work_order = WorkOrder(**work_order_data)
    db.add(db_work_order)
    db.commit()
    db.refresh(db_work_order)
    return db_work_order

def update_work_order(work_order_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[WorkOrder]:
    work_order = get_work_order_by_id(work_order_id, db, tenant_id)
    if work_order:
        for key, value in update_data.items():
            if hasattr(work_order, key) and value is not None:
                setattr(work_order, key, value)
        work_order.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(work_order)
    return work_order

def delete_work_order(work_order_id: str, db: Session, tenant_id: str = None) -> bool:
    work_order = get_work_order_by_id(work_order_id, db, tenant_id)
    if work_order:
        work_order.is_active = False
        work_order.updated_at = datetime.utcnow()
        db.commit()
        return True
    return False

def get_work_order_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    total_work_orders = db.query(WorkOrder).filter(
        WorkOrder.tenant_id == tenant_id,
        WorkOrder.is_active == True
    ).count()
    
    draft_work_orders = db.query(WorkOrder).filter(
        WorkOrder.tenant_id == tenant_id,
        WorkOrder.status == WorkOrderStatus.DRAFT,
        WorkOrder.is_active == True
    ).count()
    
    planned_work_orders = db.query(WorkOrder).filter(
        WorkOrder.tenant_id == tenant_id,
        WorkOrder.status == WorkOrderStatus.PLANNED,
        WorkOrder.is_active == True
    ).count()
    
    in_progress_work_orders = db.query(WorkOrder).filter(
        WorkOrder.tenant_id == tenant_id,
        WorkOrder.status == WorkOrderStatus.IN_PROGRESS,
        WorkOrder.is_active == True
    ).count()
    
    completed_work_orders = db.query(WorkOrder).filter(
        WorkOrder.tenant_id == tenant_id,
        WorkOrder.status == WorkOrderStatus.COMPLETED,
        WorkOrder.is_active == True
    ).count()
    
    on_hold_work_orders = db.query(WorkOrder).filter(
        WorkOrder.tenant_id == tenant_id,
        WorkOrder.status == WorkOrderStatus.ON_HOLD,
        WorkOrder.is_active == True
    ).count()
    
    urgent_work_orders = db.query(WorkOrder).filter(
        WorkOrder.tenant_id == tenant_id,
        WorkOrder.priority == WorkOrderPriority.URGENT,
        WorkOrder.is_active == True
    ).count()
    
    return {
        "total": total_work_orders,
        "draft": draft_work_orders,
        "planned": planned_work_orders,
        "in_progress": in_progress_work_orders,
        "completed": completed_work_orders,
        "on_hold": on_hold_work_orders,
        "urgent": urgent_work_orders
    }

# Work Order Task functions
def get_work_order_task_by_id(task_id: str, db: Session, tenant_id: str = None) -> Optional[WorkOrderTask]:
    query = db.query(WorkOrderTask).filter(WorkOrderTask.id == task_id)
    if tenant_id:
        query = query.filter(WorkOrderTask.tenant_id == tenant_id)
    return query.first()

def get_work_order_tasks(work_order_id: str, db: Session, tenant_id: str = None) -> List[WorkOrderTask]:
    query = db.query(WorkOrderTask).filter(WorkOrderTask.work_order_id == work_order_id)
    if tenant_id:
        query = query.filter(WorkOrderTask.tenant_id == tenant_id)
    return query.order_by(WorkOrderTask.sequence_number.asc()).all()

def create_work_order_task(task_data: dict, db: Session) -> WorkOrderTask:
    db_task = WorkOrderTask(**task_data)
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_work_order_task(task_id: str, update_data: dict, db: Session, tenant_id: str = None) -> Optional[WorkOrderTask]:
    task = get_work_order_task_by_id(task_id, db, tenant_id)
    if task:
        for key, value in update_data.items():
            if hasattr(task, key) and value is not None:
                setattr(task, key, value)
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
    return task

def delete_work_order_task(task_id: str, db: Session, tenant_id: str = None) -> bool:
    task = get_work_order_task_by_id(task_id, db, tenant_id)
    if task:
        db.delete(task)
        db.commit()
        return True
    return False

def get_next_work_order_number(db: Session, tenant_id: str) -> str:
    """Generate next work order number for a tenant"""
    # Get the last work order number for this tenant
    last_work_order = db.query(WorkOrder).filter(
        WorkOrder.tenant_id == tenant_id,
        WorkOrder.is_active == True
    ).order_by(WorkOrder.work_order_number.desc()).first()
    
    if last_work_order:
        # Extract number from last work order number (e.g., "WO-2024-001" -> "001")
        try:
            last_number = int(last_work_order.work_order_number.split('-')[-1])
            next_number = last_number + 1
        except (ValueError, IndexError):
            next_number = 1
    else:
        next_number = 1
    
    # Format: WO-YYYY-NNN (e.g., WO-2024-001)
    year = datetime.utcnow().year
    return f"WO-{year}-{next_number:03d}"
