from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ...api.dependencies import get_current_user
from ...api.dependencies import get_tenant_context
from ...config.database import get_db
from ...models.maintenance import (
    MaintenanceScheduleCreate, MaintenanceScheduleUpdate, MaintenanceScheduleResponse,
    MaintenanceWorkOrderCreate, MaintenanceWorkOrderUpdate, MaintenanceWorkOrderResponse,
    EquipmentCreate, EquipmentUpdate, EquipmentResponse,
    MaintenanceReportCreate, MaintenanceReportUpdate, MaintenanceReportResponse,
    MaintenanceDashboardStats, MaintenanceFilter
)
from ...config.maintenance_crud import (
    create_maintenance_schedule, get_maintenance_schedule_by_id, get_all_maintenance_schedules,
    update_maintenance_schedule, delete_maintenance_schedule,
    create_maintenance_work_order, get_maintenance_work_order_by_id, get_all_maintenance_work_orders,
    update_maintenance_work_order, delete_maintenance_work_order,
    create_equipment, get_equipment_by_id, get_all_equipment,
    update_equipment, delete_equipment,
    create_maintenance_report, get_maintenance_report_by_id, get_all_maintenance_reports,
    update_maintenance_report, delete_maintenance_report,
    get_maintenance_dashboard_stats, get_recent_maintenance_schedules,
    get_upcoming_maintenance, get_critical_maintenance
)

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

# Maintenance Schedule Endpoints
@router.post("/schedules", response_model=MaintenanceScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    schedule: MaintenanceScheduleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create a new maintenance schedule"""
    try:
        schedule_data = schedule.dict()
        db_schedule = create_maintenance_schedule(
            db=db,
            schedule_data=schedule_data,
            tenant_id=tenant_context.tenant_id,
            created_by_id=current_user.id
        )
        return MaintenanceScheduleResponse(
            id=str(db_schedule.id),
            tenant_id=str(db_schedule.tenant_id),
            title=db_schedule.title,
            description=db_schedule.description,
            maintenance_type=db_schedule.maintenance_type,
            priority=db_schedule.priority,
            category=db_schedule.category,
            equipment_id=str(db_schedule.equipment_id),
            location=db_schedule.location,
            scheduled_date=db_schedule.scheduled_date,
            estimated_duration_hours=db_schedule.estimated_duration_hours,
            assigned_technician_id=str(db_schedule.assigned_technician_id) if db_schedule.assigned_technician_id else None,
            required_parts=db_schedule.required_parts,
            required_tools=db_schedule.required_tools,
            safety_requirements=db_schedule.safety_requirements,
            maintenance_procedures=db_schedule.maintenance_procedures,
            estimated_cost=db_schedule.estimated_cost,
            tags=db_schedule.tags,
            created_at=db_schedule.created_at,
            updated_at=db_schedule.updated_at,
            created_by_id=str(db_schedule.created_by_id),
            updated_by_id=str(db_schedule.updated_by_id) if db_schedule.updated_by_id else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create maintenance schedule: {str(e)}")

@router.get("/schedules", response_model=List[MaintenanceScheduleResponse])
async def get_schedules(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get all maintenance schedules for the tenant"""
    try:
        schedules = get_all_maintenance_schedules(db, tenant_context.tenant_id, skip, limit)
        return [
            MaintenanceScheduleResponse(
                id=str(schedule.id),
                tenant_id=str(schedule.tenant_id),
                title=schedule.title,
                description=schedule.description,
                maintenance_type=schedule.maintenance_type,
                priority=schedule.priority,
                category=schedule.category,
                equipment_id=str(schedule.equipment_id),
                location=schedule.location,
                scheduled_date=schedule.scheduled_date,
                estimated_duration_hours=schedule.estimated_duration_hours,
                assigned_technician_id=str(schedule.assigned_technician_id) if schedule.assigned_technician_id else None,
                required_parts=schedule.required_parts,
                required_tools=schedule.required_tools,
                safety_requirements=schedule.safety_requirements,
                maintenance_procedures=schedule.maintenance_procedures,
                estimated_cost=schedule.estimated_cost,
                tags=schedule.tags,
                created_at=schedule.created_at,
                updated_at=schedule.updated_at,
                created_by_id=str(schedule.created_by_id),
                updated_by_id=str(schedule.updated_by_id) if schedule.updated_by_id else None
            ) for schedule in schedules
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance schedules: {str(e)}")

@router.get("/schedules/{schedule_id}", response_model=MaintenanceScheduleResponse)
async def get_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get a specific maintenance schedule by ID"""
    try:
        schedule = get_maintenance_schedule_by_id(db, schedule_id, tenant_context.tenant_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="Maintenance schedule not found")
        
        return MaintenanceScheduleResponse(
            id=str(schedule.id),
            tenant_id=str(schedule.tenant_id),
            title=schedule.title,
            description=schedule.description,
            maintenance_type=schedule.maintenance_type,
            priority=schedule.priority,
            category=schedule.category,
            equipment_id=str(schedule.equipment_id),
            location=schedule.location,
            scheduled_date=schedule.scheduled_date,
            estimated_duration_hours=schedule.estimated_duration_hours,
            assigned_technician_id=str(schedule.assigned_technician_id) if schedule.assigned_technician_id else None,
            required_parts=schedule.required_parts,
            required_tools=schedule.required_tools,
            safety_requirements=schedule.safety_requirements,
            maintenance_procedures=schedule.maintenance_procedures,
            estimated_cost=schedule.estimated_cost,
            tags=schedule.tags,
            created_at=schedule.created_at,
            updated_at=schedule.updated_at,
            created_by_id=str(schedule.created_by_id),
            updated_by_id=str(schedule.updated_by_id) if schedule.updated_by_id else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance schedule: {str(e)}")

@router.put("/schedules/{schedule_id}", response_model=MaintenanceScheduleResponse)
async def update_schedule(
    schedule_id: str,
    schedule_update: MaintenanceScheduleUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Update a maintenance schedule"""
    try:
        update_data = {k: v for k, v in schedule_update.dict().items() if v is not None}
        updated_schedule = update_maintenance_schedule(
            db, schedule_id, update_data, tenant_context.tenant_id, current_user.id
        )
        if not updated_schedule:
            raise HTTPException(status_code=404, detail="Maintenance schedule not found")
        
        return MaintenanceScheduleResponse(
            id=str(updated_schedule.id),
            tenant_id=str(updated_schedule.tenant_id),
            title=updated_schedule.title,
            description=updated_schedule.description,
            maintenance_type=updated_schedule.maintenance_type,
            priority=updated_schedule.priority,
            category=updated_schedule.category,
            equipment_id=str(updated_schedule.equipment_id),
            location=updated_schedule.location,
            scheduled_date=updated_schedule.scheduled_date,
            estimated_duration_hours=updated_schedule.estimated_duration_hours,
            assigned_technician_id=str(updated_schedule.assigned_technician_id) if updated_schedule.assigned_technician_id else None,
            required_parts=updated_schedule.required_parts,
            required_tools=updated_schedule.required_tools,
            safety_requirements=updated_schedule.safety_requirements,
            maintenance_procedures=updated_schedule.maintenance_procedures,
            estimated_cost=updated_schedule.estimated_cost,
            tags=updated_schedule.tags,
            created_at=updated_schedule.created_at,
            updated_at=updated_schedule.updated_at,
            created_by_id=str(updated_schedule.created_by_id),
            updated_by_id=str(updated_schedule.updated_by_id) if updated_schedule.updated_by_id else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update maintenance schedule: {str(e)}")

@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule(
    schedule_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Delete a maintenance schedule"""
    try:
        success = delete_maintenance_schedule(db, schedule_id, tenant_context.tenant_id)
        if not success:
            raise HTTPException(status_code=404, detail="Maintenance schedule not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete maintenance schedule: {str(e)}")

# Maintenance Work Order Endpoints
@router.post("/work-orders", response_model=MaintenanceWorkOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_work_order(
    work_order: MaintenanceWorkOrderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create a new maintenance work order"""
    try:
        work_order_data = work_order.dict()
        db_work_order = create_maintenance_work_order(
            db=db,
            work_order_data=work_order_data,
            tenant_id=tenant_context.tenant_id,
            created_by_id=current_user.id
        )
        return MaintenanceWorkOrderResponse(
            id=str(db_work_order.id),
            tenant_id=str(db_work_order.tenant_id),
            maintenance_schedule_id=str(db_work_order.maintenance_schedule_id),
            technician_id=str(db_work_order.technician_id),
            start_time=db_work_order.start_time,
            end_time=db_work_order.end_time,
            status=db_work_order.status,
            actual_duration_hours=db_work_order.actual_duration_hours,
            work_performed=db_work_order.work_performed,
            parts_used=db_work_order.parts_used,
            tools_used=db_work_order.tools_used,
            issues_encountered=db_work_order.issues_encountered,
            solutions_applied=db_work_order.solutions_applied,
            quality_checks=db_work_order.quality_checks,
            photos=db_work_order.photos,
            documents=db_work_order.documents,
            notes=db_work_order.notes,
            approval_required=db_work_order.approval_required,
            approved_by_id=str(db_work_order.approved_by_id) if db_work_order.approved_by_id else None,
            created_at=db_work_order.created_at,
            updated_at=db_work_order.updated_at,
            created_by_id=str(db_work_order.created_by_id),
            updated_by_id=str(db_work_order.updated_by_id) if db_work_order.updated_by_id else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create maintenance work order: {str(e)}")

@router.get("/work-orders", response_model=List[MaintenanceWorkOrderResponse])
async def get_work_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get all maintenance work orders for the tenant"""
    try:
        work_orders = get_all_maintenance_work_orders(db, tenant_context.tenant_id, skip, limit)
        return [
            MaintenanceWorkOrderResponse(
                id=str(wo.id),
                tenant_id=str(wo.tenant_id),
                maintenance_schedule_id=str(wo.maintenance_schedule_id),
                technician_id=str(wo.technician_id),
                start_time=wo.start_time,
                end_time=wo.end_time,
                status=wo.status,
                actual_duration_hours=wo.actual_duration_hours,
                work_performed=wo.work_performed,
                parts_used=wo.parts_used,
                tools_used=wo.tools_used,
                issues_encountered=wo.issues_encountered,
                solutions_applied=wo.solutions_applied,
                quality_checks=wo.quality_checks,
                photos=wo.photos,
                documents=wo.documents,
                notes=wo.notes,
                approval_required=wo.approval_required,
                approved_by_id=str(wo.approved_by_id) if wo.approved_by_id else None,
                created_at=wo.created_at,
                updated_at=wo.updated_at,
                created_by_id=str(wo.created_by_id),
                updated_by_id=str(wo.updated_by_id) if wo.updated_by_id else None
            ) for wo in work_orders
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance work orders: {str(e)}")

@router.get("/work-orders/{work_order_id}", response_model=MaintenanceWorkOrderResponse)
async def get_work_order(
    work_order_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get a specific maintenance work order by ID"""
    try:
        work_order = get_maintenance_work_order_by_id(db, work_order_id, tenant_context.tenant_id)
        if not work_order:
            raise HTTPException(status_code=404, detail="Maintenance work order not found")
        
        return MaintenanceWorkOrderResponse(
            id=str(work_order.id),
            tenant_id=str(work_order.tenant_id),
            maintenance_schedule_id=str(work_order.maintenance_schedule_id),
            technician_id=str(work_order.technician_id),
            start_time=work_order.start_time,
            end_time=work_order.end_time,
            status=work_order.status,
            actual_duration_hours=work_order.actual_duration_hours,
            work_performed=work_order.work_performed,
            parts_used=work_order.parts_used,
            tools_used=work_order.tools_used,
            issues_encountered=work_order.issues_encountered,
            solutions_applied=work_order.solutions_applied,
            quality_checks=work_order.quality_checks,
            photos=work_order.photos,
            documents=work_order.documents,
            notes=work_order.notes,
            approval_required=work_order.approval_required,
            approved_by_id=str(work_order.approved_by_id) if work_order.approved_by_id else None,
            created_at=work_order.created_at,
            updated_at=work_order.updated_at,
            created_by_id=str(work_order.created_by_id),
            updated_by_id=str(work_order.updated_by_id) if work_order.updated_by_id else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance work order: {str(e)}")

@router.put("/work-orders/{work_order_id}", response_model=MaintenanceWorkOrderResponse)
async def update_work_order(
    work_order_id: str,
    work_order_update: MaintenanceWorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Update a maintenance work order"""
    try:
        update_data = {k: v for k, v in work_order_update.dict().items() if v is not None}
        updated_work_order = update_maintenance_work_order(
            db, work_order_id, update_data, tenant_context.tenant_id, current_user.id
        )
        if not updated_work_order:
            raise HTTPException(status_code=404, detail="Maintenance work order not found")
        
        return MaintenanceWorkOrderResponse(
            id=str(updated_work_order.id),
            tenant_id=str(updated_work_order.tenant_id),
            maintenance_schedule_id=str(updated_work_order.maintenance_schedule_id),
            technician_id=str(updated_work_order.technician_id),
            start_time=updated_work_order.start_time,
            end_time=updated_work_order.end_time,
            status=updated_work_order.status,
            actual_duration_hours=updated_work_order.actual_duration_hours,
            work_performed=updated_work_order.work_performed,
            parts_used=updated_work_order.parts_used,
            tools_used=updated_work_order.tools_used,
            issues_encountered=updated_work_order.issues_encountered,
            solutions_applied=updated_work_order.solutions_applied,
            quality_checks=updated_work_order.quality_checks,
            photos=updated_work_order.photos,
            documents=updated_work_order.documents,
            notes=updated_work_order.notes,
            approval_required=updated_work_order.approval_required,
            approved_by_id=str(updated_work_order.approved_by_id) if updated_work_order.approved_by_id else None,
            created_at=updated_work_order.created_at,
            updated_at=updated_work_order.updated_at,
            created_by_id=str(updated_work_order.created_by_id),
            updated_by_id=str(updated_work_order.updated_by_id) if updated_work_order.updated_by_id else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update maintenance work order: {str(e)}")

@router.delete("/work-orders/{work_order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_work_order(
    work_order_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Delete a maintenance work order"""
    try:
        success = delete_maintenance_work_order(db, work_order_id, tenant_context.tenant_id)
        if not success:
            raise HTTPException(status_code=404, detail="Maintenance work order not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete maintenance work order: {str(e)}")

# Equipment Endpoints
@router.post("/equipment", response_model=EquipmentResponse, status_code=status.HTTP_201_CREATED)
async def create_equipment_endpoint(
    equipment: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create new equipment"""
    try:
        equipment_data = equipment.dict()
        db_equipment = create_equipment(
            db=db,
            equipment_data=equipment_data,
            tenant_id=tenant_context.tenant_id,
            created_by_id=current_user.id
        )
        return EquipmentResponse(
            id=str(db_equipment.id),
            tenant_id=str(db_equipment.tenant_id),
            name=db_equipment.name,
            model=db_equipment.model,
            serial_number=db_equipment.serial_number,
            manufacturer=db_equipment.manufacturer,
            category=db_equipment.category,
            location=db_equipment.location,
            status=db_equipment.status,
            installation_date=db_equipment.installation_date,
            warranty_expiry=db_equipment.warranty_expiry,
            last_maintenance_date=db_equipment.last_maintenance_date,
            next_maintenance_date=db_equipment.next_maintenance_date,
            maintenance_interval_hours=db_equipment.maintenance_interval_hours,
            operating_hours=db_equipment.operating_hours,
            specifications=db_equipment.specifications,
            maintenance_history=db_equipment.maintenance_history,
            assigned_technicians=db_equipment.assigned_technicians,
            critical_spare_parts=db_equipment.critical_spare_parts,
            operating_instructions=db_equipment.operating_instructions,
            safety_guidelines=db_equipment.safety_guidelines,
            tags=db_equipment.tags,
            created_at=db_equipment.created_at,
            updated_at=db_equipment.updated_at,
            created_by_id=str(db_equipment.created_by_id),
            updated_by_id=str(db_equipment.updated_by_id) if db_equipment.updated_by_id else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create equipment: {str(e)}")

@router.get("/equipment", response_model=List[EquipmentResponse])
async def get_equipment_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get all equipment for the tenant"""
    try:
        equipment_list = get_all_equipment(db, tenant_context.tenant_id, skip, limit)
        return [
            EquipmentResponse(
                id=str(eq.id),
                tenant_id=str(eq.tenant_id),
                name=eq.name,
                model=eq.model,
                serial_number=eq.serial_number,
                manufacturer=eq.manufacturer,
                category=eq.category,
                location=eq.location,
                status=eq.status,
                installation_date=eq.installation_date,
                warranty_expiry=eq.warranty_expiry,
                last_maintenance_date=eq.last_maintenance_date,
                next_maintenance_date=eq.next_maintenance_date,
                maintenance_interval_hours=eq.maintenance_interval_hours,
                operating_hours=eq.operating_hours,
                specifications=eq.specifications,
                maintenance_history=eq.maintenance_history,
                assigned_technicians=eq.assigned_technicians,
                critical_spare_parts=eq.critical_spare_parts,
                operating_instructions=eq.operating_instructions,
                safety_guidelines=eq.safety_guidelines,
                tags=eq.tags,
                created_at=eq.created_at,
                updated_at=eq.updated_at,
                created_by_id=str(eq.created_by_id),
                updated_by_id=str(eq.updated_by_id) if eq.updated_by_id else None
            ) for eq in equipment_list
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch equipment: {str(e)}")

@router.get("/equipment/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment(
    equipment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get a specific equipment by ID"""
    try:
        equipment = get_equipment_by_id(db, equipment_id, tenant_context.tenant_id)
        if not equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        return EquipmentResponse(
            id=str(equipment.id),
            tenant_id=str(equipment.tenant_id),
            name=equipment.name,
            model=equipment.model,
            serial_number=equipment.serial_number,
            manufacturer=equipment.manufacturer,
            category=equipment.category,
            location=equipment.location,
            status=equipment.status,
            installation_date=equipment.installation_date,
            warranty_expiry=equipment.warranty_expiry,
            last_maintenance_date=equipment.last_maintenance_date,
            next_maintenance_date=equipment.next_maintenance_date,
            maintenance_interval_hours=equipment.maintenance_interval_hours,
            operating_hours=equipment.operating_hours,
            specifications=equipment.specifications,
            maintenance_history=equipment.maintenance_history,
            assigned_technicians=equipment.assigned_technicians,
            critical_spare_parts=equipment.critical_spare_parts,
            operating_instructions=equipment.operating_instructions,
            safety_guidelines=equipment.safety_guidelines,
            tags=equipment.tags,
            created_at=equipment.created_at,
            updated_at=equipment.updated_at,
            created_by_id=str(equipment.created_by_id),
            updated_by_id=str(equipment.updated_by_id) if equipment.updated_by_id else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch equipment: {str(e)}")

@router.put("/equipment/{equipment_id}", response_model=EquipmentResponse)
async def update_equipment_endpoint(
    equipment_id: str,
    equipment_update: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Update equipment"""
    try:
        update_data = {k: v for k, v in equipment_update.dict().items() if v is not None}
        updated_equipment = update_equipment(
            db, equipment_id, update_data, tenant_context.tenant_id, current_user.id
        )
        if not updated_equipment:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        return EquipmentResponse(
            id=str(updated_equipment.id),
            tenant_id=str(updated_equipment.tenant_id),
            name=updated_equipment.name,
            model=updated_equipment.model,
            serial_number=updated_equipment.serial_number,
            manufacturer=updated_equipment.manufacturer,
            category=updated_equipment.category,
            location=updated_equipment.location,
            status=updated_equipment.status,
            installation_date=updated_equipment.installation_date,
            warranty_expiry=updated_equipment.warranty_expiry,
            last_maintenance_date=updated_equipment.last_maintenance_date,
            next_maintenance_date=updated_equipment.next_maintenance_date,
            maintenance_interval_hours=updated_equipment.maintenance_interval_hours,
            operating_hours=updated_equipment.operating_hours,
            specifications=updated_equipment.specifications,
            maintenance_history=updated_equipment.maintenance_history,
            assigned_technicians=updated_equipment.assigned_technicians,
            critical_spare_parts=updated_equipment.critical_spare_parts,
            operating_instructions=updated_equipment.operating_instructions,
            safety_guidelines=updated_equipment.safety_guidelines,
            tags=updated_equipment.tags,
            created_at=updated_equipment.created_at,
            updated_at=updated_equipment.updated_at,
            created_by_id=str(updated_equipment.created_by_id),
            updated_by_id=str(updated_equipment.updated_by_id) if updated_equipment.updated_by_id else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update equipment: {str(e)}")

@router.delete("/equipment/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment_endpoint(
    equipment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Delete equipment"""
    try:
        success = delete_equipment(db, equipment_id, tenant_context.tenant_id)
        if not success:
            raise HTTPException(status_code=404, detail="Equipment not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete equipment: {str(e)}")

# Maintenance Report Endpoints
@router.post("/reports", response_model=MaintenanceReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    report: MaintenanceReportCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Create a new maintenance report"""
    try:
        report_data = report.dict()
        db_report = create_maintenance_report(
            db=db,
            report_data=report_data,
            tenant_id=tenant_context.tenant_id,
            created_by_id=current_user.id
        )
        return MaintenanceReportResponse(
            id=str(db_report.id),
            tenant_id=str(db_report.tenant_id),
            title=db_report.title,
            description=db_report.description,
            maintenance_work_order_id=str(db_report.maintenance_work_order_id),
            equipment_id=str(db_report.equipment_id),
            report_date=db_report.report_date,
            maintenance_type=db_report.maintenance_type,
            technician_id=str(db_report.technician_id),
            work_summary=db_report.work_summary,
            parts_replaced=db_report.parts_replaced,
            tools_used=db_report.tools_used,
            issues_found=db_report.issues_found,
            recommendations=db_report.recommendations,
            next_maintenance_date=db_report.next_maintenance_date,
            cost_breakdown=db_report.cost_breakdown,
            total_cost=db_report.total_cost,
            efficiency_improvement=db_report.efficiency_improvement,
            safety_improvements=db_report.safety_improvements,
            compliance_notes=db_report.compliance_notes,
            photos=db_report.photos,
            documents=db_report.documents,
            approval_status=db_report.approval_status,
            approved_by_id=str(db_report.approved_by_id) if db_report.approved_by_id else None,
            created_at=db_report.created_at,
            updated_at=db_report.updated_at,
            created_by_id=str(db_report.created_by_id),
            updated_by_id=str(db_report.updated_by_id) if db_report.updated_by_id else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create maintenance report: {str(e)}")

@router.get("/reports", response_model=List[MaintenanceReportResponse])
async def get_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get all maintenance reports for the tenant"""
    try:
        reports = get_all_maintenance_reports(db, tenant_context.tenant_id, skip, limit)
        return [
            MaintenanceReportResponse(
                id=str(report.id),
                tenant_id=str(report.tenant_id),
                title=report.title,
                description=report.description,
                maintenance_work_order_id=str(report.maintenance_work_order_id),
                equipment_id=str(report.equipment_id),
                report_date=report.report_date,
                maintenance_type=report.maintenance_type,
                technician_id=str(report.technician_id),
                work_summary=report.work_summary,
                parts_replaced=report.parts_replaced,
                tools_used=report.tools_used,
                issues_found=report.issues_found,
                recommendations=report.recommendations,
                next_maintenance_date=report.next_maintenance_date,
                cost_breakdown=report.cost_breakdown,
                total_cost=report.total_cost,
                efficiency_improvement=report.efficiency_improvement,
                safety_improvements=report.safety_improvements,
                compliance_notes=report.compliance_notes,
                photos=report.photos,
                documents=report.documents,
                approval_status=report.approval_status,
                approved_by_id=str(report.approved_by_id) if report.approved_by_id else None,
                created_at=report.created_at,
                updated_at=report.updated_at,
                created_by_id=str(report.created_by_id),
                updated_by_id=str(report.updated_by_id) if report.updated_by_id else None
            ) for report in reports
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance reports: {str(e)}")

@router.get("/reports/{report_id}", response_model=MaintenanceReportResponse)
async def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get a specific maintenance report by ID"""
    try:
        report = get_maintenance_report_by_id(db, report_id, tenant_context.tenant_id)
        if not report:
            raise HTTPException(status_code=404, detail="Maintenance report not found")
        
        return MaintenanceReportResponse(
            id=str(report.id),
            tenant_id=str(report.tenant_id),
            title=report.title,
            description=report.description,
            maintenance_work_order_id=str(report.maintenance_work_order_id),
            equipment_id=str(report.equipment_id),
            report_date=report.report_date,
            maintenance_type=report.maintenance_type,
            technician_id=str(report.technician_id),
            work_summary=report.work_summary,
            parts_replaced=report.parts_replaced,
            tools_used=report.tools_used,
            issues_found=report.issues_found,
            recommendations=report.recommendations,
            next_maintenance_date=report.next_maintenance_date,
            cost_breakdown=report.cost_breakdown,
            total_cost=report.total_cost,
            efficiency_improvement=report.efficiency_improvement,
            safety_improvements=report.safety_improvements,
            compliance_notes=report.compliance_notes,
            photos=report.photos,
            documents=report.documents,
            approval_status=report.approval_status,
            approved_by_id=str(report.approved_by_id) if report.approved_by_id else None,
            created_at=report.created_at,
            updated_at=report.updated_at,
            created_by_id=str(report.created_by_id),
            updated_by_id=str(report.updated_by_id) if report.updated_by_id else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance report: {str(e)}")

@router.put("/reports/{report_id}", response_model=MaintenanceReportResponse)
async def update_report(
    report_id: str,
    report_update: MaintenanceReportUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Update a maintenance report"""
    try:
        update_data = {k: v for k, v in report_update.dict().items() if v is not None}
        updated_report = update_maintenance_report(
            db, report_id, update_data, tenant_context.tenant_id, current_user.id
        )
        if not updated_report:
            raise HTTPException(status_code=404, detail="Maintenance report not found")
        
        return MaintenanceReportResponse(
            id=str(updated_report.id),
            tenant_id=str(updated_report.tenant_id),
            title=updated_report.title,
            description=updated_report.description,
            maintenance_work_order_id=str(updated_report.maintenance_work_order_id),
            equipment_id=str(updated_report.equipment_id),
            report_date=updated_report.report_date,
            maintenance_type=updated_report.maintenance_type,
            technician_id=str(updated_report.technician_id),
            work_summary=updated_report.work_summary,
            parts_replaced=updated_report.parts_replaced,
            tools_used=updated_report.tools_used,
            issues_found=updated_report.issues_found,
            recommendations=updated_report.recommendations,
            next_maintenance_date=updated_report.next_maintenance_date,
            cost_breakdown=updated_report.cost_breakdown,
            total_cost=updated_report.total_cost,
            efficiency_improvement=updated_report.efficiency_improvement,
            safety_improvements=updated_report.safety_improvements,
            compliance_notes=updated_report.compliance_notes,
            photos=updated_report.photos,
            documents=updated_report.documents,
            approval_status=updated_report.approval_status,
            approved_by_id=str(updated_report.approved_by_id) if updated_report.approved_by_id else None,
            created_at=updated_report.created_at,
            updated_at=updated_report.updated_at,
            created_by_id=str(updated_report.created_by_id),
            updated_by_id=str(updated_report.updated_by_id) if updated_report.updated_by_id else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update maintenance report: {str(e)}")

@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Delete a maintenance report"""
    try:
        success = delete_maintenance_report(db, report_id, tenant_context.tenant_id)
        if not success:
            raise HTTPException(status_code=404, detail="Maintenance report not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete maintenance report: {str(e)}")

# Dashboard and Statistics Endpoints
@router.get("/dashboard", response_model=MaintenanceDashboardStats)
async def get_maintenance_dashboard(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get maintenance dashboard statistics"""
    try:
        stats = get_maintenance_dashboard_stats(db, tenant_context.tenant_id)
        return MaintenanceDashboardStats(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch maintenance dashboard stats: {str(e)}")

@router.get("/stats/recent-schedules")
async def get_recent_schedules(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get recent maintenance schedules"""
    try:
        schedules = get_recent_maintenance_schedules(db, tenant_context.tenant_id, limit)
        return schedules
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch recent maintenance schedules: {str(e)}")

@router.get("/stats/upcoming-maintenance")
async def get_upcoming_maintenance_endpoint(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get upcoming maintenance schedules"""
    try:
        schedules = get_upcoming_maintenance(db, tenant_context.tenant_id, limit)
        return schedules
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch upcoming maintenance: {str(e)}")

@router.get("/stats/critical-maintenance")
async def get_critical_maintenance_endpoint(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context = Depends(get_tenant_context)
):
    """Get critical priority maintenance schedules"""
    try:
        schedules = get_critical_maintenance(db, tenant_context.tenant_id, limit)
        return schedules
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch critical maintenance: {str(e)}")
