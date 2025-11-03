from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid

from ..dependencies import get_current_user, get_tenant_context
from ...config.database import get_db
from ...presentation.dependencies.mediator import get_mediator
from ...core.mediator import Mediator
from ...core.result import Result
from ...application.commands import (
    CreateWorkOrderCommand, UpdateWorkOrderCommand, DeleteWorkOrderCommand
)
from ...application.queries import (
    GetWorkOrderByIdQuery, GetAllWorkOrdersQuery
)
from ...models.unified_models import (
    User, WorkOrderBase, WorkOrderCreate, WorkOrderUpdate, WorkOrderResponse
)
from ...config.workshop_crud import (
    get_work_order_by_id, get_all_work_orders, get_work_orders_by_status, get_work_orders_by_type,
    get_work_orders_by_assigned_user, get_work_orders_by_project, create_work_order, update_work_order, delete_work_order,
    get_work_order_stats, get_next_work_order_number,
    get_work_order_task_by_id, get_work_order_tasks, create_work_order_task, update_work_order_task, delete_work_order_task
)
from ...config.workshop_models import WorkOrder, WorkOrderTask, WorkOrderStatus, WorkOrderPriority, WorkOrderType

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])

@router.get("/", response_model=List[WorkOrderResponse])
async def get_work_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    work_order_type: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    assigned_to_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Get all work orders for the current tenant"""
    tenant_id = str(tenant_context["tenant_id"])
    page = (skip // limit) + 1 if limit > 0 else 1
    
    query = GetAllWorkOrdersQuery(
        tenant_id=tenant_id,
        page=page,
        page_size=limit
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    work_orders_data = result.value
    entities = work_orders_data.items if hasattr(work_orders_data, 'items') else work_orders_data if isinstance(work_orders_data, list) else []
    
    if status or work_order_type or project_id or assigned_to_id:
        filtered_work_orders = []
        for wo in entities:
            if status and getattr(wo, 'status', None) != status:
                continue
            if work_order_type and getattr(wo, 'work_order_type', None) != work_order_type:
                continue
            if project_id and getattr(wo, 'project_id', None) and str(wo.project_id) != project_id:
                continue
            if assigned_to_id and getattr(wo, 'assigned_to_id', None) and str(wo.assigned_to_id) != assigned_to_id:
                continue
            filtered_work_orders.append(wo)
        entities = filtered_work_orders
    
    db_work_orders = [get_work_order_by_id(str(wo.id), db, tenant_id) for wo in entities if hasattr(wo, 'id')]
    
    work_orders = []
    for db_work_order in db_work_orders:
        if db_work_order:
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
async def get_work_order(
    work_order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Get a specific work order by ID"""
    tenant_id = str(tenant_context["tenant_id"])
    
    query = GetWorkOrderByIdQuery(
        workorder_id=work_order_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(query)
    
    if not result.is_success:
        raise HTTPException(status_code=500, detail=result.error_message)
    
    wo_entity = result.value
    if not wo_entity:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    db_work_order = get_work_order_by_id(work_order_id, db, tenant_id)
    if not db_work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    
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

@router.post("/", response_model=WorkOrderResponse)
async def create_work_order_endpoint(
    work_order: WorkOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Create a new work order"""
    tenant_id = str(tenant_context["tenant_id"])
    work_order_number = get_next_work_order_number(db, tenant_id)
    wo_dict = work_order.dict()
    
    planned_start = wo_dict.get('planned_start_date')
    if planned_start and isinstance(planned_start, str):
        planned_start = datetime.fromisoformat(planned_start)
    
    planned_end = wo_dict.get('planned_end_date')
    if planned_end and isinstance(planned_end, str):
        planned_end = datetime.fromisoformat(planned_end)
    
    command = CreateWorkOrderCommand(
        tenant_id=tenant_id,
        title=wo_dict.get('title', ''),
        description=wo_dict.get('description', ''),
        work_order_number=work_order_number,
        work_order_type=wo_dict.get('work_order_type', 'maintenance'),
        status=wo_dict.get('status', 'pending'),
        priority=wo_dict.get('priority', 'medium'),
        planned_start_date=planned_start or datetime.utcnow(),
        planned_end_date=planned_end or datetime.utcnow(),
        actual_start_date=wo_dict.get('actual_start_date') or datetime.utcnow(),
        actual_end_date=wo_dict.get('actual_end_date') or datetime.utcnow(),
        estimated_hours=wo_dict.get('estimated_hours', 0.0),
        actual_hours=0.0,
        estimated_cost=wo_dict.get('estimated_cost', 0.0),
        actual_cost=0.0,
        assigned_to_id=wo_dict.get('assigned_to_id', '') if wo_dict.get('assigned_to_id') else '',
        project_id=wo_dict.get('project_id', '') if wo_dict.get('project_id') else '',
        approved_by_id=wo_dict.get('approved_by_id', '') if wo_dict.get('approved_by_id') else '',
        equipment_id=wo_dict.get('equipment_id', '') if wo_dict.get('equipment_id') else '',
        location=wo_dict.get('location', ''),
        instructions=wo_dict.get('instructions', ''),
        safety_notes=wo_dict.get('safety_notes', ''),
        quality_requirements=wo_dict.get('quality_requirements', ''),
        current_step=wo_dict.get('current_step', ''),
        materials_required=wo_dict.get('materials_required', []),
        notes=wo_dict.get('notes', []),
        tags=wo_dict.get('tags', []),
        attachments=wo_dict.get('attachments', []),
        completion_percentage=0.0,
        is_active=True,
        created_by_id=str(current_user.id),
        created_by=str(current_user.id)
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=400, detail=result.error_message)
    
    wo_entity = result.value
    db_work_order = get_work_order_by_id(str(wo_entity.id), db, tenant_id) if hasattr(wo_entity, 'id') else None
    
    if not db_work_order:
        raise HTTPException(status_code=500, detail="Failed to retrieve created work order")
    
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

@router.put("/{work_order_id}", response_model=WorkOrderResponse)
async def update_work_order_endpoint(
    work_order_id: str,
    work_order: WorkOrderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Update an existing work order"""
    tenant_id = str(tenant_context["tenant_id"])
    update_dict = work_order.dict(exclude_unset=True)
    
    planned_start = update_dict.get('planned_start_date')
    if planned_start and isinstance(planned_start, str):
        planned_start = datetime.fromisoformat(planned_start)
    
    planned_end = update_dict.get('planned_end_date')
    if planned_end and isinstance(planned_end, str):
        planned_end = datetime.fromisoformat(planned_end)
    
    actual_start = update_dict.get('actual_start_date')
    if actual_start and isinstance(actual_start, str):
        actual_start = datetime.fromisoformat(actual_start)
    
    actual_end = update_dict.get('actual_end_date')
    if actual_end and isinstance(actual_end, str):
        actual_end = datetime.fromisoformat(actual_end)
    
    command = UpdateWorkOrderCommand(
        workorder_id=work_order_id,
        tenant_id=tenant_id,
        title=update_dict.get('title'),
        description=update_dict.get('description'),
        work_order_type=update_dict.get('work_order_type'),
        status=update_dict.get('status'),
        priority=update_dict.get('priority'),
        planned_start_date=planned_start,
        planned_end_date=planned_end,
        actual_start_date=actual_start,
        actual_end_date=actual_end,
        estimated_hours=update_dict.get('estimated_hours'),
        actual_hours=update_dict.get('actual_hours'),
        estimated_cost=update_dict.get('estimated_cost'),
        actual_cost=update_dict.get('actual_cost'),
        assigned_to_id=update_dict.get('assigned_to_id'),
        project_id=update_dict.get('project_id'),
        approved_by_id=update_dict.get('approved_by_id'),
        equipment_id=update_dict.get('equipment_id'),
        location=update_dict.get('location'),
        instructions=update_dict.get('instructions'),
        safety_notes=update_dict.get('safety_notes'),
        quality_requirements=update_dict.get('quality_requirements'),
        current_step=update_dict.get('current_step'),
        materials_required=update_dict.get('materials_required'),
        notes=update_dict.get('notes'),
        tags=update_dict.get('tags'),
        attachments=update_dict.get('attachments'),
        completion_percentage=update_dict.get('completion_percentage'),
        is_active=update_dict.get('is_active')
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    wo_entity = result.value
    db_work_order = get_work_order_by_id(work_order_id, db, tenant_id)
    if not db_work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    
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

@router.delete("/{work_order_id}")
async def delete_work_order_endpoint(
    work_order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: dict = Depends(get_tenant_context),
    mediator: Mediator = Depends(get_mediator)
):
    """Delete a work order"""
    tenant_id = str(tenant_context["tenant_id"])
    
    command = DeleteWorkOrderCommand(
        workorder_id=work_order_id,
        tenant_id=tenant_id
    )
    
    result: Result = await mediator.send(command)
    
    if not result.is_success:
        raise HTTPException(status_code=404 if "not found" in result.error_message.lower() else 400, detail=result.error_message)
    
    return {"success": True, "message": "Work order deleted successfully"}

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
