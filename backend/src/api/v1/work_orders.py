from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ..dependencies import get_current_user, get_tenant_context
from ...config.database import get_db
from ...models.user_models import User
from ...models.project_models import WorkOrderBase, WorkOrderCreate, WorkOrderUpdate, WorkOrderResponse
from ...config.workshop_crud import (
    get_work_order_by_id, get_all_work_orders, get_work_orders_by_status, get_work_orders_by_type,
    get_work_orders_by_assigned_user, get_work_orders_by_project, create_work_order, update_work_order, delete_work_order,
    get_work_order_stats, get_next_work_order_number,
    get_work_order_task_by_id, get_work_order_tasks, create_work_order_task, update_work_order_task, delete_work_order_task
)
from ...config.workshop_models import WorkOrder, WorkOrderTask, WorkOrderStatus, WorkOrderPriority, WorkOrderType

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])

@router.get("", response_model=List[WorkOrderResponse])
def get_work_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    work_order_type: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    assigned_to_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all work orders for the current tenant"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        if status:
            db_work_orders = get_work_orders_by_status(status, db, tenant_id, skip, limit)
        elif work_order_type:
            db_work_orders = get_work_orders_by_type(work_order_type, db, tenant_id, skip, limit)
        elif project_id:
            db_work_orders = get_work_orders_by_project(project_id, db, tenant_id, skip, limit)
        elif assigned_to_id:
            db_work_orders = get_work_orders_by_assigned_user(assigned_to_id, db, tenant_id, skip, limit)
        else:
            db_work_orders = get_all_work_orders(db, tenant_id, skip, limit)
        
        # Convert SQLAlchemy models to Pydantic models
        work_orders = []
        for db_work_order in db_work_orders:
            work_order_dict = {
                "id": str(db_work_order.id),
                "work_order_number": db_work_order.work_order_number,
                "tenant_id": str(db_work_order.tenant_id),
                "created_by_id": str(db_work_order.created_by_id),
                "title": db_work_order.title,
                "description": db_work_order.description,
                "work_order_type": db_work_order.work_order_type,
                "status": db_work_order.status,
                "priority": db_work_order.priority,
                "planned_start_date": db_work_order.planned_start_date,
                "planned_end_date": db_work_order.planned_end_date,
                "actual_start_date": db_work_order.actual_start_date,
                "actual_end_date": db_work_order.actual_end_date,
                "estimated_hours": db_work_order.estimated_hours,
                "actual_hours": db_work_order.actual_hours or 0.0,
                "completion_percentage": db_work_order.completion_percentage or 0.0,
                "assigned_to_id": str(db_work_order.assigned_to_id) if db_work_order.assigned_to_id else None,
                "project_id": str(db_work_order.project_id) if db_work_order.project_id else None,
                "approved_by_id": str(db_work_order.approved_by_id) if db_work_order.approved_by_id else None,
                "location": db_work_order.location,
                "instructions": db_work_order.instructions,
                "safety_notes": db_work_order.safety_notes,
                "quality_requirements": db_work_order.quality_requirements,
                "materials_required": db_work_order.materials_required or [],
                "estimated_cost": db_work_order.estimated_cost,
                "current_step": db_work_order.current_step,
                "notes": db_work_order.notes or [],
                "tags": db_work_order.tags or [],
                "attachments": db_work_order.attachments or [],
                "is_active": db_work_order.is_active,
                "created_at": db_work_order.created_at,
                "updated_at": db_work_order.updated_at
            }
            work_orders.append(WorkOrderResponse(**work_order_dict))
        
        return work_orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get work orders: {str(e)}")

@router.get("/stats")
def get_work_order_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get work order statistics for the current tenant"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        stats = get_work_order_stats(db, tenant_id)
        return {"success": True, "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get work order statistics: {str(e)}")

@router.get("/{work_order_id}", response_model=WorkOrderResponse)
def get_work_order(
    work_order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get a specific work order by ID"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        db_work_order = get_work_order_by_id(work_order_id, db, tenant_id)
        
        if not db_work_order:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        # Convert SQLAlchemy model to Pydantic model
        work_order_dict = {
            "id": str(db_work_order.id),
            "work_order_number": db_work_order.work_order_number,
            "tenant_id": str(db_work_order.tenant_id),
            "created_by_id": str(db_work_order.created_by_id),
            "title": db_work_order.title,
            "description": db_work_order.description,
            "work_order_type": db_work_order.work_order_type,
            "status": db_work_order.status,
            "priority": db_work_order.priority,
            "planned_start_date": db_work_order.planned_start_date,
            "planned_end_date": db_work_order.planned_end_date,
            "actual_start_date": db_work_order.actual_start_date,
            "actual_end_date": db_work_order.actual_end_date,
            "estimated_hours": db_work_order.estimated_hours,
            "actual_hours": db_work_order.actual_hours or 0.0,
            "completion_percentage": db_work_order.completion_percentage or 0.0,
            "assigned_to_id": str(db_work_order.assigned_to_id) if db_work_order.assigned_to_id else None,
            "project_id": str(db_work_order.project_id) if db_work_order.project_id else None,
            "approved_by_id": str(db_work_order.approved_by_id) if db_work_order.approved_by_id else None,
            "location": db_work_order.location,
            "instructions": db_work_order.instructions,
            "safety_notes": db_work_order.safety_notes,
            "quality_requirements": db_work_order.quality_requirements,
            "materials_required": db_work_order.materials_required or [],
            "estimated_cost": db_work_order.estimated_cost,
            "current_step": db_work_order.current_step,
            "notes": db_work_order.notes or [],
            "tags": db_work_order.tags or [],
            "attachments": db_work_order.attachments or [],
            "is_active": db_work_order.is_active,
            "created_at": db_work_order.created_at,
            "updated_at": db_work_order.updated_at
        }
        
        return WorkOrderResponse(**work_order_dict)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get work order: {str(e)}")

@router.post("", response_model=WorkOrderResponse)
def create_work_order_endpoint(
    work_order: WorkOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new work order"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        # Generate work order number
        work_order_number = get_next_work_order_number(db, tenant_id)
        
        # Prepare data
        work_order_data = work_order.dict()
        
        # Convert date strings to datetime objects
        if work_order_data.get('planned_start_date'):
            if isinstance(work_order_data['planned_start_date'], str):
                work_order_data['planned_start_date'] = datetime.fromisoformat(work_order_data['planned_start_date'])
        if work_order_data.get('planned_end_date'):
            if isinstance(work_order_data['planned_end_date'], str):
                work_order_data['planned_end_date'] = datetime.fromisoformat(work_order_data['planned_end_date'])
            
        work_order_data.update({
            "id": str(uuid.uuid4()),
            "tenant_id": tenant_id,
            "created_by_id": str(current_user.id),
            "work_order_number": work_order_number,
            "actual_hours": 0.0,
            "completion_percentage": 0.0,
            "notes": [],
            "attachments": [],
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        db_work_order = create_work_order(work_order_data, db)
        
        # Convert SQLAlchemy model to Pydantic model
        work_order_dict = {
            "id": str(db_work_order.id),
            "work_order_number": db_work_order.work_order_number,
            "tenant_id": str(db_work_order.tenant_id),
            "created_by_id": str(db_work_order.created_by_id),
            "title": db_work_order.title,
            "description": db_work_order.description,
            "work_order_type": db_work_order.work_order_type,
            "status": db_work_order.status,
            "priority": db_work_order.priority,
            "planned_start_date": db_work_order.planned_start_date,
            "planned_end_date": db_work_order.planned_end_date,
            "actual_start_date": db_work_order.actual_start_date,
            "actual_end_date": db_work_order.actual_end_date,
            "estimated_hours": db_work_order.estimated_hours,
            "actual_hours": db_work_order.actual_hours or 0.0,
            "completion_percentage": db_work_order.completion_percentage or 0.0,
            "assigned_to_id": str(db_work_order.assigned_to_id) if db_work_order.assigned_to_id else None,
            "project_id": str(db_work_order.project_id) if db_work_order.project_id else None,
            "approved_by_id": str(db_work_order.approved_by_id) if db_work_order.approved_by_id else None,
            "location": db_work_order.location,
            "instructions": db_work_order.instructions,
            "safety_notes": db_work_order.safety_notes,
            "quality_requirements": db_work_order.quality_requirements,
            "materials_required": db_work_order.materials_required or [],
            "estimated_cost": db_work_order.estimated_cost,
            "current_step": db_work_order.current_step,
            "notes": db_work_order.notes or [],
            "tags": db_work_order.tags or [],
            "attachments": db_work_order.attachments or [],
            "is_active": db_work_order.is_active,
            "created_at": db_work_order.created_at,
            "updated_at": db_work_order.updated_at
        }
        
        return WorkOrderResponse(**work_order_dict)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create work order: {str(e)}")

@router.put("/{work_order_id}", response_model=WorkOrderResponse)
def update_work_order_endpoint(
    work_order_id: str,
    work_order: WorkOrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Update an existing work order"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        # Check if work order exists
        existing_work_order = get_work_order_by_id(work_order_id, db, tenant_id)
        if not existing_work_order:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        # Prepare update data
        work_order_update = work_order.dict(exclude_unset=True)
        
        # Convert date strings to datetime objects
        if work_order_update.get('planned_start_date'):
            if isinstance(work_order_update['planned_start_date'], str):
                work_order_update['planned_start_date'] = datetime.fromisoformat(work_order_update['planned_start_date'])
        if work_order_update.get('planned_end_date'):
            if isinstance(work_order_update['planned_end_date'], str):
                work_order_update['planned_end_date'] = datetime.fromisoformat(work_order_update['planned_end_date'])
        if work_order_update.get('actual_start_date'):
            if isinstance(work_order_update['actual_start_date'], str):
                work_order_update['actual_start_date'] = datetime.fromisoformat(work_order_update['actual_start_date'])
        if work_order_update.get('actual_end_date'):
            if isinstance(work_order_update['actual_end_date'], str):
                work_order_update['actual_end_date'] = datetime.fromisoformat(work_order_update['actual_end_date'])
        
        work_order_update["updated_at"] = datetime.utcnow()
        
        db_work_order = update_work_order(work_order_id, work_order_update, db, tenant_id)
        if not db_work_order:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        # Convert SQLAlchemy model to Pydantic model
        work_order_dict = {
            "id": str(db_work_order.id),
            "work_order_number": db_work_order.work_order_number,
            "tenant_id": str(db_work_order.tenant_id),
            "created_by_id": str(db_work_order.created_by_id),
            "title": db_work_order.title,
            "description": db_work_order.description,
            "work_order_type": db_work_order.work_order_type,
            "status": db_work_order.status,
            "priority": db_work_order.priority,
            "planned_start_date": db_work_order.planned_start_date,
            "planned_end_date": db_work_order.planned_end_date,
            "actual_start_date": db_work_order.actual_start_date,
            "actual_end_date": db_work_order.actual_end_date,
            "estimated_hours": db_work_order.estimated_hours,
            "actual_hours": db_work_order.actual_hours or 0.0,
            "completion_percentage": db_work_order.completion_percentage or 0.0,
            "assigned_to_id": str(db_work_order.assigned_to_id) if db_work_order.assigned_to_id else None,
            "project_id": str(db_work_order.project_id) if db_work_order.project_id else None,
            "approved_by_id": str(db_work_order.approved_by_id) if db_work_order.approved_by_id else None,
            "location": db_work_order.location,
            "instructions": db_work_order.instructions,
            "safety_notes": db_work_order.safety_notes,
            "quality_requirements": db_work_order.quality_requirements,
            "materials_required": db_work_order.materials_required or [],
            "estimated_cost": db_work_order.estimated_cost,
            "current_step": db_work_order.current_step,
            "notes": db_work_order.notes or [],
            "tags": db_work_order.tags or [],
            "attachments": db_work_order.attachments or [],
            "is_active": db_work_order.is_active,
            "created_at": db_work_order.created_at,
            "updated_at": db_work_order.updated_at
        }
        
        return WorkOrderResponse(**work_order_dict)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update work order: {str(e)}")

@router.delete("/{work_order_id}")
def delete_work_order_endpoint(
    work_order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Delete a work order"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        # Check if work order exists
        existing_work_order = get_work_order_by_id(work_order_id, db, tenant_id)
        if not existing_work_order:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        success = delete_work_order(work_order_id, db, tenant_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete work order")
        
        return {"success": True, "message": "Work order deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete work order: {str(e)}")

# Work Order Tasks Endpoints
@router.get("/{work_order_id}/tasks")
def get_work_order_tasks_endpoint(
    work_order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get all tasks for a specific work order"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        # Check if work order exists
        existing_work_order = get_work_order_by_id(work_order_id, db, tenant_id)
        if not existing_work_order:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        tasks = get_work_order_tasks(work_order_id, db, tenant_id)
        return {"success": True, "tasks": tasks}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get work order tasks: {str(e)}")

@router.post("/{work_order_id}/tasks")
def create_work_order_task_endpoint(
    work_order_id: str,
    task_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Create a new task for a work order"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        # Check if work order exists
        existing_work_order = get_work_order_by_id(work_order_id, db, tenant_id)
        if not existing_work_order:
            raise HTTPException(status_code=404, detail="Work order not found")
        
        task_data.update({
            "id": str(uuid.uuid4()),
            "work_order_id": work_order_id,
            "tenant_id": tenant_id,
            "created_by_id": str(current_user.id),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
        
        db_task = create_work_order_task(task_data, db)
        return {"success": True, "task": db_task}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create work order task: {str(e)}")