from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
import logging

from ...config.database import get_db
from ...api.dependencies import get_current_user
from ...config.workshop_crud import (
    get_work_order_by_id, get_all_work_orders, get_work_orders_by_status, get_work_orders_by_type,
    get_work_orders_by_assigned_user, get_work_orders_by_project, create_work_order, update_work_order, delete_work_order,
    get_work_order_stats, get_next_work_order_number,
    get_work_order_task_by_id, get_work_order_tasks, create_work_order_task, update_work_order_task, delete_work_order_task
)
from ...config.workshop_models import WorkOrder, WorkOrderTask, WorkOrderStatus, WorkOrderPriority, WorkOrderType
from ...models.unified_models import WorkOrderBase, WorkOrderCreate, WorkOrderUpdate, WorkOrderResponse
from ...api.dependencies import get_tenant_context

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/work-orders", tags=["Work Orders"])

@router.get("/", response_model=List[WorkOrderResponse])
async def get_work_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    work_order_type: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    assigned_to_id: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get all work orders for the current tenant with optional filters"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if status:
            work_orders = get_work_orders_by_status(status, db, tenant_id, skip, limit)
        elif work_order_type:
            work_orders = get_work_orders_by_type(work_order_type, db, tenant_id, skip, limit)
        elif project_id:
            work_orders = get_work_orders_by_project(project_id, db, tenant_id, skip, limit)
        elif assigned_to_id:
            work_orders = get_work_orders_by_assigned_user(assigned_to_id, db, tenant_id, skip, limit)
        else:
            work_orders = get_all_work_orders(db, tenant_id, skip, limit)
        
        return work_orders
    except Exception as e:
        logger.error(f"Error getting work orders: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get work orders")

@router.get("/stats")
async def get_work_order_statistics(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get work order statistics for the current tenant"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        stats = get_work_order_stats(db, tenant_id)
        return {"success": True, "stats": stats}
    except Exception as e:
        logger.error(f"Error getting work order stats: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get work order statistics")

@router.get("/{work_order_id}", response_model=WorkOrderResponse)
async def get_work_order(
    work_order_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get a specific work order by ID"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        work_order = get_work_order_by_id(work_order_id, db, tenant_id)
        if not work_order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")
        return work_order
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting work order: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get work order")

@router.post("/", response_model=WorkOrderResponse)
async def create_new_work_order(
    work_order_data: WorkOrderCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Create a new work order"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        # Generate work order number
        work_order_number = get_next_work_order_number(db, tenant_id)
        
        # Prepare data
        work_order_dict = work_order_data.dict()
        work_order_dict.update({
            "tenant_id": tenant_id,
            "created_by_id": current_user.id,
            "work_order_number": work_order_number
        })
        
        work_order = create_work_order(work_order_dict, db)
        return work_order
    except Exception as e:
        logger.error(f"Error creating work order: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create work order")

@router.put("/{work_order_id}", response_model=WorkOrderResponse)
async def update_work_order(
    work_order_id: str,
    work_order_data: WorkOrderUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Update an existing work order"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        # Check if work order exists
        existing_work_order = get_work_order_by_id(work_order_id, db, tenant_id)
        if not existing_work_order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")
        
        # Update data
        update_data = work_order_data.dict(exclude_unset=True)
        work_order = update_work_order(work_order_id, update_data, db, tenant_id)
        
        if not work_order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")
        
        return work_order
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating work order: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update work order")

@router.delete("/{work_order_id}")
async def delete_work_order(
    work_order_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Delete a work order (soft delete)"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        # Check if work order exists
        existing_work_order = get_work_order_by_id(work_order_id, db, tenant_id)
        if not existing_work_order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")
        
        success = delete_work_order(work_order_id, db, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete work order")
        
        return {"success": True, "message": "Work order deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting work order: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete work order")

# Work Order Tasks endpoints
@router.get("/{work_order_id}/tasks")
async def get_work_order_tasks(
    work_order_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get all tasks for a specific work order"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        # Check if work order exists
        existing_work_order = get_work_order_by_id(work_order_id, db, tenant_id)
        if not existing_work_order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")
        
        tasks = get_work_order_tasks(work_order_id, db, tenant_id)
        return {"success": True, "tasks": tasks}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting work order tasks: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get work order tasks")

@router.post("/{work_order_id}/tasks")
async def create_work_order_task(
    work_order_id: str,
    task_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Create a new task for a work order"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        # Check if work order exists
        existing_work_order = get_work_order_by_id(work_order_id, db, tenant_id)
        if not existing_work_order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")
        
        # Prepare task data
        task_dict = task_data.copy()
        task_dict.update({
            "work_order_id": work_order_id,
            "tenant_id": tenant_id
        })
        
        task = create_work_order_task(task_dict, db)
        return {"success": True, "task": task}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating work order task: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create work order task")
