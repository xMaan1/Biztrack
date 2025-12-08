from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import logging

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.common import ModulePermission
from ...config.production_crud import (
    get_production_plan_by_id, get_all_production_plans, get_production_plans_by_status,
    get_production_plans_by_priority, get_production_plans_by_project, get_production_plans_by_work_order,
    get_production_plans_by_assigned_user, create_production_plan, update_production_plan,
    delete_production_plan, get_next_production_plan_number, get_production_plan_stats,
    get_production_step_by_id, get_production_steps_by_plan, create_production_step,
    update_production_step, delete_production_step,
    get_production_schedule_by_id, get_production_schedules_by_plan, create_production_schedule,
    update_production_schedule, delete_production_schedule
)
from ...models.production import (
    ProductionPlanCreate, ProductionPlanUpdate, ProductionPlanResponse, ProductionPlansResponse,
    ProductionStepCreate, ProductionStepUpdate, ProductionStepResponse, ProductionStepsResponse,
    ProductionScheduleCreate, ProductionScheduleUpdate, ProductionScheduleResponse, ProductionSchedulesResponse,
    ProductionDashboardStats, ProductionDashboard, ProductionPlanFilters
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/production", tags=["Production Planning"])

# Production Plan endpoints
@router.get("/", response_model=List[ProductionPlanResponse])
async def get_production_plans(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    production_type: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    work_order_id: Optional[str] = Query(None),
    assigned_to_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value))
):
    """Get all production plans with optional filtering"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        if status:
            production_plans = get_production_plans_by_status(status, db, tenant_id, skip, limit)
        elif priority:
            production_plans = get_production_plans_by_priority(priority, db, tenant_id, skip, limit)
        elif production_type:
            production_plans = get_production_plans_by_project(production_type, db, tenant_id, skip, limit)
        elif project_id:
            production_plans = get_production_plans_by_project(project_id, db, tenant_id, skip, limit)
        elif work_order_id:
            production_plans = get_production_plans_by_work_order(work_order_id, db, tenant_id, skip, limit)
        elif assigned_to_id:
            production_plans = get_production_plans_by_assigned_user(assigned_to_id, db, tenant_id, skip, limit)
        else:
            production_plans = get_all_production_plans(db, tenant_id, skip, limit)
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            production_plans = [
                plan for plan in production_plans
                if search_lower in plan.title.lower() or 
                   (plan.description and search_lower in plan.description.lower()) or
                   search_lower in plan.plan_number.lower()
            ]
        
        return [ProductionPlanResponse.from_orm(plan) for plan in production_plans]
    except Exception as e:
        logger.error(f"Error getting production plans: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get production plans")

@router.get("/stats")
async def get_production_statistics(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value))
):
    """Get production planning statistics"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        stats = get_production_plan_stats(db, tenant_id)
        return stats
    except Exception as e:
        logger.error(f"Error getting production statistics: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get production statistics")

@router.get("/dashboard")
async def get_production_dashboard(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value))
):
    """Get production planning dashboard data"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Get basic stats
        stats = get_production_plan_stats(db, tenant_id)
        
        # Get recent plans
        recent_plans = get_all_production_plans(db, tenant_id, 0, 5)
        
        # Get upcoming deadlines (plans ending in next 7 days)
        upcoming_deadlines = []
        if stats["planned_plans"] > 0 or stats["in_progress_plans"] > 0:
            all_plans = get_all_production_plans(db, tenant_id, 0, 1000)
            upcoming_deadlines = [
                plan for plan in all_plans
                if plan.planned_end_date and 
                plan.status in ["planned", "in_progress"] and
                plan.planned_end_date > datetime.utcnow() and
                plan.planned_end_date <= datetime.utcnow() + timedelta(days=7)
            ][:5]
        
        # Get priority alerts (high and urgent priority plans)
        priority_alerts = []
        if stats["priority_counts"].get("high", 0) > 0 or stats["priority_counts"].get("urgent", 0) > 0:
            high_priority_plans = get_production_plans_by_priority("high", db, tenant_id, 0, 5)
            urgent_priority_plans = get_production_plans_by_priority("urgent", db, tenant_id, 0, 5)
            priority_alerts = (high_priority_plans + urgent_priority_plans)[:5]
        
        dashboard_data = ProductionDashboard(
            stats=ProductionDashboardStats(
                total_plans=stats["total_plans"],
                status_counts=stats["status_counts"],
                priority_counts=stats["priority_counts"],
                completion_rate=stats["completion_rate"],
                completed_plans=stats["completed_plans"],
                in_progress_plans=stats["status_counts"].get("in_progress", 0),
                planned_plans=stats["status_counts"].get("planned", 0),
                on_hold_plans=stats["status_counts"].get("on_hold", 0),
                cancelled_plans=stats["status_counts"].get("cancelled", 0)
            ),
            recent_plans=recent_plans,
            upcoming_deadlines=upcoming_deadlines,
            priority_alerts=priority_alerts
        )
        
        return dashboard_data
    except Exception as e:
        logger.error(f"Error getting production dashboard: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get production dashboard")

@router.get("/{production_plan_id}", response_model=ProductionPlanResponse)
async def get_production_plan(
    production_plan_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value))
):
    """Get a specific production plan by ID"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        production_plan = get_production_plan_by_id(production_plan_id, db, tenant_id)
        if not production_plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production plan not found")
        return ProductionPlanResponse.from_orm(production_plan)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting production plan: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get production plan")

@router.post("/", response_model=ProductionPlanResponse)
async def create_new_production_plan(
    production_plan_data: ProductionPlanCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_CREATE.value))
):
    """Create a new production plan"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Generate production plan number
        plan_number = get_next_production_plan_number(db, tenant_id)
        
        # Prepare data
        plan_dict = production_plan_data.dict()
        plan_dict.update({
            "tenant_id": tenant_id,
            "created_by_id": current_user.id,
            "plan_number": plan_number,
            "status": "planned"
        })
        
        production_plan = create_production_plan(plan_dict, db)
        return ProductionPlanResponse.from_orm(production_plan)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating production plan: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create production plan")

@router.put("/{production_plan_id}", response_model=ProductionPlanResponse)
async def update_production_plan_endpoint(
    production_plan_id: str,
    production_plan_data: ProductionPlanUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_UPDATE.value))
):
    """Update a production plan"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        production_plan = update_production_plan(production_plan_id, production_plan_data.dict(exclude_unset=True), db, tenant_id)
        if not production_plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production plan not found")
        return ProductionPlanResponse.from_orm(production_plan)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating production plan: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update production plan")

@router.delete("/{production_plan_id}")
async def delete_production_plan_endpoint(
    production_plan_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_DELETE.value))
):
    """Delete a production plan"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        success = delete_production_plan(production_plan_id, db, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production plan not found")
        return {"message": "Production plan deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting production plan: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete production plan")

# Production Step endpoints
@router.get("/{production_plan_id}/steps", response_model=List[ProductionStepResponse])
async def get_production_steps(
    production_plan_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value))
):
    """Get all steps for a production plan"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        production_steps = get_production_steps_by_plan(production_plan_id, db, tenant_id)
        return production_steps
    except Exception as e:
        logger.error(f"Error getting production steps: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get production steps")

@router.post("/{production_plan_id}/steps", response_model=ProductionStepResponse)
async def create_production_step(
    production_plan_id: str,
    production_step_data: ProductionStepCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_CREATE.value))
):
    """Create a new production step"""
    try:
        # Verify production plan exists
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        production_plan = get_production_plan_by_id(production_plan_id, db, tenant_id)
        if not production_plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production plan not found")
        
        # Prepare step data
        step_dict = production_step_data.dict()
        step_dict.update({
            "production_plan_id": production_plan_id
        })
        
        production_step = create_production_step(step_dict, db)
        return production_step
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating production step: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create production step")

@router.put("/steps/{step_id}", response_model=ProductionStepResponse)
async def update_production_step(
    step_id: str,
    production_step_data: ProductionStepUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_UPDATE.value))
):
    """Update a production step"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        production_step = update_production_step(step_id, production_step_data.dict(exclude_unset=True), db, tenant_id)
        if not production_step:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production step not found")
        return production_step
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating production step: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update production step")

@router.delete("/steps/{step_id}")
async def delete_production_step(
    step_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_DELETE.value))
):
    """Delete a production step"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        success = delete_production_step(step_id, db, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production step not found")
        return {"message": "Production step deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting production step: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete production step")

# Production Schedule endpoints
@router.get("/{production_plan_id}/schedules", response_model=List[ProductionScheduleResponse])
async def get_production_schedules(
    production_plan_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_VIEW.value))
):
    """Get all schedules for a production plan"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        production_schedules = get_production_schedules_by_plan(production_plan_id, db, tenant_id)
        return production_schedules
    except Exception as e:
        logger.error(f"Error getting production schedules: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get production schedules")

@router.post("/{production_plan_id}/schedules", response_model=ProductionScheduleResponse)
async def create_production_schedule(
    production_plan_id: str,
    production_schedule_data: ProductionScheduleCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_CREATE.value))
):
    """Create a new production schedule"""
    try:
        # Verify production plan exists
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        production_plan = get_production_plan_by_id(production_plan_id, db, tenant_id)
        if not production_plan:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production plan not found")
        
        # Prepare schedule data
        schedule_dict = production_schedule_data.dict()
        schedule_dict.update({
            "production_plan_id": production_plan_id,
            "tenant_id": tenant_id
        })
        
        production_schedule = create_production_schedule(schedule_dict, db)
        return production_schedule
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating production schedule: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create production schedule")

@router.put("/schedules/{schedule_id}", response_model=ProductionScheduleResponse)
async def update_production_schedule(
    schedule_id: str,
    production_schedule_data: ProductionScheduleUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_UPDATE.value))
):
    """Update a production schedule"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        production_schedule = update_production_schedule(schedule_id, production_schedule_data.dict(exclude_unset=True), db, tenant_id)
        if not production_schedule:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production schedule not found")
        return production_schedule
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating production schedule: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update production schedule")

@router.delete("/schedules/{schedule_id}")
async def delete_production_schedule(
    schedule_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.PRODUCTION_DELETE.value))
):
    """Delete a production schedule"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        success = delete_production_schedule(schedule_id, db, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Production schedule not found")
        return {"message": "Production schedule deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting production schedule: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete production schedule")
