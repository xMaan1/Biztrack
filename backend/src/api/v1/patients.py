from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from pydantic import BaseModel

from ...models.healthcare import (
    PatientCreate, PatientUpdate, PatientResponse, PatientStatsResponse
)
from ...config.database import get_db
from ...config.patient_crud import (
    create_patient, get_patient_by_id, get_patients, update_patient, delete_patient, get_patient_stats
)
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.common import ModulePermission

class PatientsResponse(BaseModel):
    patients: List[PatientResponse]
    total: int

router = APIRouter(prefix="/patients", tags=["patients"])

@router.post("", response_model=PatientResponse)
async def create_patient_endpoint(
    patient_data: PatientCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    try:
        patient = create_patient(db, patient_data.dict(), tenant_context["tenant_id"])
        return PatientResponse.model_validate(patient)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create patient: {str(e)}")

@router.get("", response_model=PatientsResponse)
async def get_patients_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    patients, total = get_patients(
        db, 
        tenant_context["tenant_id"], 
        skip, 
        limit, 
        search, 
        status
    )
    return PatientsResponse(
        patients=[PatientResponse.model_validate(patient) for patient in patients],
        total=total
    )

@router.get("/stats", response_model=PatientStatsResponse)
async def get_patient_stats_endpoint(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    stats = get_patient_stats(db, tenant_context["tenant_id"])
    return PatientStatsResponse(**stats)

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient_endpoint(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    patient = get_patient_by_id(db, patient_id, tenant_context["tenant_id"])
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientResponse.model_validate(patient)

@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient_endpoint(
    patient_id: str,
    patient_data: PatientUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    patient = update_patient(db, patient_id, patient_data.dict(exclude_unset=True), tenant_context["tenant_id"])
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientResponse.model_validate(patient)

@router.delete("/{patient_id}")
async def delete_patient_endpoint(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    success = delete_patient(db, patient_id, tenant_context["tenant_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient deleted successfully"}

