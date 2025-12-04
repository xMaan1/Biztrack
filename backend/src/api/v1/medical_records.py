from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from pydantic import BaseModel

from ...models.healthcare import (
    MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordResponse, MedicalRecordStatsResponse
)
from ...config.database import get_db
from ...config.medical_record_crud import (
    create_medical_record, get_medical_record_by_id, get_medical_records, update_medical_record, delete_medical_record, get_medical_record_stats
)
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.unified_models import ModulePermission

class MedicalRecordsResponse(BaseModel):
    records: List[MedicalRecordResponse]
    total: int

router = APIRouter(prefix="/medical-records", tags=["medical-records"])

@router.post("", response_model=MedicalRecordResponse)
async def create_medical_record_endpoint(
    record_data: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    record_dict = record_data.dict()
    record_dict["createdById"] = current_user.id
    
    try:
        record = create_medical_record(db, record_dict, tenant_context["tenant_id"])
        return MedicalRecordResponse.model_validate(record)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create medical record: {str(e)}")

@router.get("", response_model=MedicalRecordsResponse)
async def get_medical_records_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    patient_id: Optional[str] = Query(None),
    record_type: Optional[str] = Query(None),
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
    records, total = get_medical_records(
        db, 
        tenant_context["tenant_id"], 
        skip, 
        limit, 
        patient_id, 
        record_type, 
        doctor_id, 
        date_from, 
        date_to
    )
    return MedicalRecordsResponse(
        records=[MedicalRecordResponse.from_attributes(record) for record in records],
        total=total
    )

@router.get("/stats", response_model=MedicalRecordStatsResponse)
async def get_medical_record_stats_endpoint(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    stats = get_medical_record_stats(db, tenant_context["tenant_id"])
    return MedicalRecordStatsResponse(**stats)

@router.get("/{record_id}", response_model=MedicalRecordResponse)
async def get_medical_record_endpoint(
    record_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    record = get_medical_record_by_id(db, record_id, tenant_context["tenant_id"])
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return MedicalRecordResponse.from_attributes(record)

@router.put("/{record_id}", response_model=MedicalRecordResponse)
async def update_medical_record_endpoint(
    record_id: str,
    record_data: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    record = update_medical_record(db, record_id, record_data.dict(exclude_unset=True), tenant_context["tenant_id"])
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return MedicalRecordResponse.from_attributes(record)

@router.delete("/{record_id}")
async def delete_medical_record_endpoint(
    record_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    success = delete_medical_record(db, record_id, tenant_context["tenant_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Medical record not found")
    return {"message": "Medical record deleted successfully"}

