from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from pydantic import BaseModel

from ...models.healthcare import (
    ConsultationCreate, ConsultationUpdate, ConsultationResponse, ConsultationStatsResponse
)
from ...config.database import get_db
from ...config.consultation_crud import (
    create_consultation, get_consultation_by_id, get_consultations, update_consultation, delete_consultation, get_consultation_stats
)
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.common import ModulePermission

class ConsultationsResponse(BaseModel):
    consultations: List[ConsultationResponse]
    total: int

router = APIRouter(prefix="/consultations", tags=["consultations"])

@router.post("", response_model=ConsultationResponse)
async def create_consultation_endpoint(
    consultation_data: ConsultationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    consultation_dict = consultation_data.dict()
    consultation_dict["createdById"] = current_user.id
    
    try:
        consultation = create_consultation(db, consultation_dict, tenant_context["tenant_id"])
        return ConsultationResponse.model_validate(consultation)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create consultation: {str(e)}")

@router.get("", response_model=ConsultationsResponse)
async def get_consultations_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    consultations, total = get_consultations(
        db, 
        tenant_context["tenant_id"], 
        skip, 
        limit, 
        patient_id, 
        doctor_id, 
        date_from, 
        date_to
    )
    return ConsultationsResponse(
        consultations=[ConsultationResponse.model_validate(consultation) for consultation in consultations],
        total=total
    )

@router.get("/stats", response_model=ConsultationStatsResponse)
async def get_consultation_stats_endpoint(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    stats = get_consultation_stats(db, tenant_context["tenant_id"])
    return ConsultationStatsResponse(**stats)

@router.get("/{consultation_id}", response_model=ConsultationResponse)
async def get_consultation_endpoint(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    consultation = get_consultation_by_id(db, consultation_id, tenant_context["tenant_id"])
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return ConsultationResponse.model_validate(consultation)

@router.put("/{consultation_id}", response_model=ConsultationResponse)
async def update_consultation_endpoint(
    consultation_id: str,
    consultation_data: ConsultationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    consultation = update_consultation(db, consultation_id, consultation_data.dict(exclude_unset=True), tenant_context["tenant_id"])
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return ConsultationResponse.model_validate(consultation)

@router.delete("/{consultation_id}")
async def delete_consultation_endpoint(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    success = delete_consultation(db, consultation_id, tenant_context["tenant_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return {"message": "Consultation deleted successfully"}

