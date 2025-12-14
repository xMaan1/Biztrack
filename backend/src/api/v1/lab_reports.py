from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from pydantic import BaseModel

from ...models.healthcare import (
    LabReportCreate, LabReportUpdate, LabReportResponse, LabReportStatsResponse
)
from ...config.database import get_db
from ...config.lab_report_crud import (
    create_lab_report, get_lab_report_by_id, get_lab_reports, update_lab_report, delete_lab_report, get_lab_report_stats, verify_lab_report
)
from ...api.dependencies import get_current_user, get_tenant_context, require_permission
from ...models.common import ModulePermission

class LabReportsResponse(BaseModel):
    labReports: List[LabReportResponse]
    total: int

router = APIRouter(prefix="/lab-reports", tags=["lab-reports"])

@router.post("", response_model=LabReportResponse)
async def create_lab_report_endpoint(
    lab_report_data: LabReportCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_CREATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    
    lab_report_dict = lab_report_data.dict()
    lab_report_dict["createdById"] = current_user.id
    
    try:
        lab_report = create_lab_report(db, lab_report_dict, tenant_context["tenant_id"])
        return LabReportResponse.model_validate(lab_report)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create lab report: {str(e)}")

@router.get("", response_model=LabReportsResponse)
async def get_lab_reports_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    test_category: Optional[str] = Query(None),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    is_verified: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    lab_reports, total = get_lab_reports(
        db, 
        tenant_context["tenant_id"], 
        skip, 
        limit, 
        patient_id, 
        doctor_id, 
        test_category, 
        date_from, 
        date_to,
        is_verified
    )
    return LabReportsResponse(
        labReports=[LabReportResponse.model_validate(lab_report) for lab_report in lab_reports],
        total=total
    )

@router.get("/stats", response_model=LabReportStatsResponse)
async def get_lab_report_stats_endpoint(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    stats = get_lab_report_stats(db, tenant_context["tenant_id"])
    return LabReportStatsResponse(**stats)

@router.get("/{lab_report_id}", response_model=LabReportResponse)
async def get_lab_report_endpoint(
    lab_report_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_VIEW.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    lab_report = get_lab_report_by_id(db, lab_report_id, tenant_context["tenant_id"])
    if not lab_report:
        raise HTTPException(status_code=404, detail="Lab report not found")
    return LabReportResponse.model_validate(lab_report)

@router.put("/{lab_report_id}", response_model=LabReportResponse)
async def update_lab_report_endpoint(
    lab_report_id: str,
    lab_report_data: LabReportUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    lab_report = update_lab_report(db, lab_report_id, lab_report_data.dict(exclude_unset=True), tenant_context["tenant_id"])
    if not lab_report:
        raise HTTPException(status_code=404, detail="Lab report not found")
    return LabReportResponse.model_validate(lab_report)

@router.delete("/{lab_report_id}")
async def delete_lab_report_endpoint(
    lab_report_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_DELETE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    success = delete_lab_report(db, lab_report_id, tenant_context["tenant_id"])
    if not success:
        raise HTTPException(status_code=404, detail="Lab report not found")
    return {"message": "Lab report deleted successfully"}

@router.post("/{lab_report_id}/verify", response_model=LabReportResponse)
async def verify_lab_report_endpoint(
    lab_report_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_context: Optional[dict] = Depends(get_tenant_context),
    _: dict = Depends(require_permission(ModulePermission.CRM_UPDATE.value))
):
    if not tenant_context:
        raise HTTPException(status_code=400, detail="Tenant context required")
    lab_report = verify_lab_report(db, lab_report_id, str(current_user.id), tenant_context["tenant_id"])
    if not lab_report:
        raise HTTPException(status_code=404, detail="Lab report not found")
    return LabReportResponse.model_validate(lab_report)

