from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from pydantic import BaseModel

from ...models.healthcare import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse, AppointmentStatsResponse
)
from ...config.database import get_db
from ...config.appointment_crud import (
    create_appointment, get_appointment_by_id, get_appointments, update_appointment, delete_appointment, get_appointment_stats
)
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.unified_models import ModulePermission

class AppointmentsResponse(BaseModel):
    appointments: List[AppointmentResponse]
    total: int

router = APIRouter(prefix="/appointments", tags=["appointments"])

@router.post("", response_model=AppointmentResponse)
async def create_appointment_endpoint(
    appointment_data: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    appointment_dict = appointment_data.dict()
    appointment_dict["createdById"] = current_user.id
    
    try:
        appointment = create_appointment(db, appointment_dict, tenant_context["tenant_id"])
        return AppointmentResponse.model_validate(appointment)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create appointment: {str(e)}")

@router.get("", response_model=AppointmentsResponse)
async def get_appointments_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    appointments, total = get_appointments(
        db, 
        tenant_context["tenant_id"], 
        skip, 
        limit, 
        patient_id, 
        doctor_id, 
        status, 
        date_from, 
        date_to
    )
    return AppointmentsResponse(
        appointments=[AppointmentResponse.model_validate(appointment) for appointment in appointments],
        total=total
    )

@router.get("/stats", response_model=AppointmentStatsResponse)
async def get_appointment_stats_endpoint(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    stats = get_appointment_stats(db, tenant_context["tenant_id"])
    return AppointmentStatsResponse(**stats)

@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment_endpoint(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    appointment = get_appointment_by_id(db, appointment_id, tenant_context["tenant_id"])
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return AppointmentResponse.model_validate(appointment)

@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment_endpoint(
    appointment_id: str,
    appointment_data: AppointmentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    appointment = update_appointment(db, appointment_id, appointment_data.dict(exclude_unset=True), tenant_context["tenant_id"])
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return AppointmentResponse.model_validate(appointment)

@router.delete("/{appointment_id}")
async def delete_appointment_endpoint(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    success = delete_appointment(db, appointment_id, tenant_context["tenant_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment deleted successfully"}

