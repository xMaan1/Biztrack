from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
from .production_models import ProductionPlan, ProductionStep, ProductionSchedule, ProductionStatus, ProductionPriority, ProductionType

# Production Plan CRUD operations
def get_production_plan_by_id(plan_id: str, db: Session, tenant_id: Optional[str] = None) -> Optional[ProductionPlan]:
    """Get a production plan by ID with tenant isolation"""
    query = db.query(ProductionPlan).filter(ProductionPlan.id == plan_id)
    if tenant_id:
        query = query.filter(ProductionPlan.tenant_id == tenant_id)
    return query.first()

def get_all_production_plans(
    db: Session, 
    tenant_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[ProductionPlan]:
    """Get all production plans with tenant isolation and pagination"""
    query = db.query(ProductionPlan)
    if tenant_id:
        query = query.filter(ProductionPlan.tenant_id == tenant_id)
    return query.offset(skip).limit(limit).all()

def get_production_plans_by_status(
    status: str, 
    db: Session, 
    tenant_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[ProductionPlan]:
    """Get production plans by status with tenant isolation"""
    query = db.query(ProductionPlan).filter(ProductionPlan.status == status)
    if tenant_id:
        query = query.filter(ProductionPlan.tenant_id == tenant_id)
    return query.offset(skip).limit(limit).all()

def get_production_plans_by_priority(
    priority: str, 
    db: Session, 
    tenant_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[ProductionPlan]:
    """Get production plans by priority with tenant isolation"""
    query = db.query(ProductionPlan).filter(ProductionPlan.priority == priority)
    if tenant_id:
        query = query.filter(ProductionPlan.tenant_id == tenant_id)
    return query.offset(skip).limit(limit).all()

def get_production_plans_by_project(
    project_id: str, 
    db: Session, 
    tenant_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[ProductionPlan]:
    """Get production plans by project with tenant isolation"""
    query = db.query(ProductionPlan).filter(ProductionPlan.project_id == project_id)
    if tenant_id:
        query = query.filter(ProductionPlan.tenant_id == tenant_id)
    return query.offset(skip).limit(limit).all()

def get_production_plans_by_work_order(
    work_order_id: str, 
    db: Session, 
    tenant_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[ProductionPlan]:
    """Get production plans by work order with tenant isolation"""
    query = db.query(ProductionPlan).filter(ProductionPlan.work_order_id == work_order_id)
    if tenant_id:
        query = query.filter(ProductionPlan.tenant_id == tenant_id)
    return query.offset(skip).limit(limit).all()

def get_production_plans_by_assigned_user(
    assigned_to_id: str, 
    db: Session, 
    tenant_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
) -> List[ProductionPlan]:
    """Get production plans by assigned user with tenant isolation"""
    query = db.query(ProductionPlan).filter(ProductionPlan.assigned_to_id == assigned_to_id)
    if tenant_id:
        query = query.filter(ProductionPlan.tenant_id == tenant_id)
    return query.offset(skip).limit(limit).all()

def create_production_plan(plan_data: Dict[str, Any], db: Session) -> ProductionPlan:
    """Create a new production plan"""
    plan = ProductionPlan(**plan_data)
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

def update_production_plan(
    plan_id: str, 
    plan_data: Dict[str, Any], 
    db: Session, 
    tenant_id: Optional[str] = None
) -> Optional[ProductionPlan]:
    """Update a production plan with tenant isolation"""
    plan = get_production_plan_by_id(plan_id, db, tenant_id)
    if not plan:
        return None
    
    for key, value in plan_data.items():
        if hasattr(plan, key):
            setattr(plan, key, value)
    
    plan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(plan)
    return plan

def delete_production_plan(
    plan_id: str, 
    db: Session, 
    tenant_id: Optional[str] = None
) -> bool:
    """Delete a production plan with tenant isolation"""
    plan = get_production_plan_by_id(plan_id, db, tenant_id)
    if not plan:
        return False
    
    db.delete(plan)
    db.commit()
    return True

def get_next_production_plan_number(db: Session, tenant_id: str) -> str:
    """Generate next production plan number for a tenant"""
    # Get the last plan number for this tenant
    last_plan = db.query(ProductionPlan).filter(
        ProductionPlan.tenant_id == tenant_id
    ).order_by(desc(ProductionPlan.plan_number)).first()
    
    if last_plan:
        # Extract number and increment
        try:
            last_number = int(last_plan.plan_number.split('-')[-1])
            next_number = last_number + 1
        except (ValueError, IndexError):
            next_number = 1
    else:
        next_number = 1
    
    # Format: PP-YYYYMMDD-XXXXX
    date_str = datetime.now().strftime('%Y%m%d')
    return f"PP-{date_str}-{next_number:05d}"

def get_production_plan_stats(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get production plan statistics for a tenant"""
    total_plans = db.query(ProductionPlan).filter(ProductionPlan.tenant_id == tenant_id).count()
    
    status_counts = {}
    for status in ProductionStatus:
        count = db.query(ProductionPlan).filter(
            and_(
                ProductionPlan.tenant_id == tenant_id,
                ProductionPlan.status == status
            )
        ).count()
        status_counts[status.value] = count
    
    priority_counts = {}
    for priority in ProductionPriority:
        count = db.query(ProductionPlan).filter(
            and_(
                ProductionPlan.tenant_id == tenant_id,
                ProductionPlan.priority == priority
            )
        ).count()
        priority_counts[priority.value] = count
    
    # Calculate completion percentage
    completed_plans = db.query(ProductionPlan).filter(
        and_(
            ProductionPlan.tenant_id == tenant_id,
            ProductionPlan.status == ProductionStatus.COMPLETED
        )
    ).count()
    
    completion_rate = (completed_plans / total_plans * 100) if total_plans > 0 else 0
    
    return {
        "total_plans": total_plans,
        "status_counts": status_counts,
        "priority_counts": priority_counts,
        "completion_rate": round(completion_rate, 2),
        "completed_plans": completed_plans
    }

# Production Step CRUD operations
def get_production_step_by_id(step_id: str, db: Session, tenant_id: Optional[str] = None) -> Optional[ProductionStep]:
    """Get a production step by ID with tenant isolation"""
    query = db.query(ProductionStep).join(ProductionPlan).filter(ProductionStep.id == step_id)
    if tenant_id:
        query = query.filter(ProductionPlan.tenant_id == tenant_id)
    return query.first()

def get_production_steps_by_plan(
    plan_id: str, 
    db: Session, 
    tenant_id: Optional[str] = None
) -> List[ProductionStep]:
    """Get all steps for a production plan with tenant isolation"""
    query = db.query(ProductionStep).join(ProductionPlan).filter(ProductionStep.production_plan_id == plan_id)
    if tenant_id:
        query = query.filter(ProductionPlan.tenant_id == tenant_id)
    return query.order_by(ProductionStep.step_number).all()

def create_production_step(step_data: Dict[str, Any], db: Session) -> ProductionStep:
    """Create a new production step"""
    step = ProductionStep(**step_data)
    db.add(step)
    db.commit()
    db.refresh(step)
    return step

def update_production_step(
    step_id: str, 
    step_data: Dict[str, Any], 
    db: Session, 
    tenant_id: Optional[str] = None
) -> Optional[ProductionStep]:
    """Update a production step with tenant isolation"""
    step = get_production_step_by_id(step_id, db, tenant_id)
    if not step:
        return None
    
    for key, value in step_data.items():
        if hasattr(step, key):
            setattr(step, key, value)
    
    step.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(step)
    return step

def delete_production_step(
    step_id: str, 
    db: Session, 
    tenant_id: Optional[str] = None
) -> bool:
    """Delete a production step with tenant isolation"""
    step = get_production_step_by_id(step_id, db, tenant_id)
    if not step:
        return False
    
    db.delete(step)
    db.commit()
    return True

# Production Schedule CRUD operations
def get_production_schedule_by_id(schedule_id: str, db: Session, tenant_id: Optional[str] = None) -> Optional[ProductionSchedule]:
    """Get a production schedule by ID with tenant isolation"""
    query = db.query(ProductionSchedule).filter(ProductionSchedule.id == schedule_id)
    if tenant_id:
        query = query.filter(ProductionSchedule.tenant_id == tenant_id)
    return query.first()

def get_production_schedules_by_plan(
    plan_id: str, 
    db: Session, 
    tenant_id: Optional[str] = None
) -> List[ProductionSchedule]:
    """Get all schedules for a production plan with tenant isolation"""
    query = db.query(ProductionSchedule).filter(ProductionSchedule.production_plan_id == plan_id)
    if tenant_id:
        query = query.filter(ProductionSchedule.tenant_id == tenant_id)
    return query.order_by(ProductionSchedule.scheduled_start).all()

def create_production_schedule(schedule_data: Dict[str, Any], db: Session) -> ProductionSchedule:
    """Create a new production schedule"""
    schedule = ProductionSchedule(**schedule_data)
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule

def update_production_schedule(
    schedule_id: str, 
    schedule_data: Dict[str, Any], 
    db: Session, 
    tenant_id: Optional[str] = None
) -> Optional[ProductionSchedule]:
    """Update a production schedule with tenant isolation"""
    schedule = get_production_schedule_by_id(schedule_id, db, tenant_id)
    if not schedule:
        return None
    
    for key, value in schedule_data.items():
        if hasattr(schedule, key):
            setattr(schedule, key, value)
    
    schedule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(schedule)
    return schedule

def delete_production_schedule(
    schedule_id: str, 
    db: Session, 
    tenant_id: Optional[str] = None
) -> bool:
    """Delete a production schedule with tenant isolation"""
    schedule = get_production_schedule_by_id(schedule_id, db, tenant_id)
    if not schedule:
        return False
    
    db.delete(schedule)
    db.commit()
    return True
