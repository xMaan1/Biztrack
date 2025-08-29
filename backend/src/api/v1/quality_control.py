from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import logging

from ...config.database import get_db
from ...api.dependencies import get_current_user, get_tenant_context
from ...config.quality_control_crud import (
    create_quality_check, get_quality_check_by_id, get_all_quality_checks,
    get_quality_checks_by_status, get_quality_checks_by_priority,
    get_quality_checks_by_inspection_type, get_quality_checks_by_assigned_user,
    update_quality_check, delete_quality_check, get_next_quality_check_number,
    create_quality_inspection, get_quality_inspection_by_id,
    get_quality_inspections_by_check, get_quality_inspections_by_inspector,
    update_quality_inspection, delete_quality_inspection,
    create_quality_defect, get_quality_defect_by_id,
    get_quality_defects_by_severity, get_quality_defects_by_status,
    update_quality_defect, delete_quality_defect,
    create_quality_report, get_quality_report_by_id,
    get_quality_reports_by_type, update_quality_report, delete_quality_report,
    get_quality_dashboard_stats, get_recent_quality_checks,
    get_upcoming_quality_checks, get_critical_defects
)
from ...models.quality_control import (
    QualityCheckCreate, QualityCheckUpdate, QualityCheckResponse, QualityChecksResponse,
    QualityInspectionCreate, QualityInspectionUpdate, QualityInspectionResponse, QualityInspectionsResponse,
    QualityDefectCreate, QualityDefectUpdate, QualityDefectResponse, QualityDefectsResponse,
    QualityReportCreate, QualityReportUpdate, QualityReportResponse, QualityReportsResponse,
    QualityDashboard, QualityCheckFilters, QualityInspectionFilters, QualityDefectFilters
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/quality-control", tags=["Quality Control"])

# Quality Check endpoints
@router.get("/checks", response_model=List[QualityCheckResponse])
async def get_quality_checks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    inspection_type: Optional[str] = Query(None),
    production_plan_id: Optional[str] = Query(None),
    work_order_id: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    assigned_to_id: Optional[str] = Query(None),
    scheduled_date_from: Optional[datetime] = Query(None),
    scheduled_date_to: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get all quality checks with optional filtering"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        if status:
            quality_checks = get_quality_checks_by_status(status, db, tenant_id, skip, limit)
        elif priority:
            quality_checks = get_quality_checks_by_priority(priority, db, tenant_id, skip, limit)
        elif inspection_type:
            quality_checks = get_quality_checks_by_inspection_type(inspection_type, db, tenant_id, skip, limit)
        elif assigned_to_id:
            quality_checks = get_quality_checks_by_assigned_user(assigned_to_id, db, tenant_id, skip, limit)
        else:
            quality_checks = get_all_quality_checks(db, tenant_id, skip, limit)
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            quality_checks = [
                check for check in quality_checks
                if search_lower in check.title.lower() or 
                   (check.description and search_lower in check.description.lower()) or
                   search_lower in check.check_number.lower()
            ]
        
        return quality_checks
    except Exception as e:
        logger.error(f"Error getting quality checks: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality checks")

@router.get("/checks/{check_id}", response_model=QualityCheckResponse)
async def get_quality_check(
    check_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get quality check by ID"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        quality_check = get_quality_check_by_id(db, check_id, tenant_id)
        if not quality_check:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality check not found")
        
        return quality_check
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality check {check_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality check")

@router.post("/checks", response_model=QualityCheckResponse)
async def create_quality_check_endpoint(
    check_data: QualityCheckCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Create a new quality check"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict
        check_dict = check_data.dict()
        
        quality_check = create_quality_check(db, check_dict, tenant_id, current_user.id)
        return quality_check
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quality check: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create quality check")

@router.put("/checks/{check_id}", response_model=QualityCheckResponse)
async def update_quality_check_endpoint(
    check_id: str,
    check_data: QualityCheckUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Update quality check"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict, excluding None values
        update_dict = {k: v for k, v in check_data.dict().items() if v is not None}
        
        quality_check = update_quality_check(db, check_id, update_dict, tenant_id)
        if not quality_check:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality check not found")
        
        return quality_check
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating quality check {check_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update quality check")

@router.delete("/checks/{check_id}")
async def delete_quality_check_endpoint(
    check_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Delete quality check"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        success = delete_quality_check(db, check_id, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality check not found")
        
        return {"message": "Quality check deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quality check {check_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete quality check")

# Quality Inspection endpoints
@router.get("/inspections", response_model=List[QualityInspectionResponse])
async def get_quality_inspections(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    inspector_id: Optional[str] = Query(None),
    quality_check_id: Optional[str] = Query(None),
    inspection_date_from: Optional[datetime] = Query(None),
    inspection_date_to: Optional[datetime] = Query(None),
    compliance_score_min: Optional[float] = Query(None),
    compliance_score_max: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get all quality inspections with optional filtering"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        if quality_check_id:
            inspections = get_quality_inspections_by_check(quality_check_id, db, tenant_id, skip, limit)
        elif inspector_id:
            inspections = get_quality_inspections_by_inspector(inspector_id, db, tenant_id, skip, limit)
        else:
            # Get all inspections and apply filters
            inspections = []
            # This would need to be implemented in the CRUD layer
        
        return inspections
    except Exception as e:
        logger.error(f"Error getting quality inspections: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality inspections")

@router.get("/inspections/{inspection_id}", response_model=QualityInspectionResponse)
async def get_quality_inspection(
    inspection_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get quality inspection by ID"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        inspection = get_quality_inspection_by_id(db, inspection_id, tenant_id)
        if not inspection:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality inspection not found")
        
        return inspection
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality inspection")

@router.post("/inspections", response_model=QualityInspectionResponse)
async def create_quality_inspection_endpoint(
    inspection_data: QualityInspectionCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Create a new quality inspection"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict
        inspection_dict = inspection_data.dict()
        
        inspection = create_quality_inspection(db, inspection_dict, tenant_id)
        return inspection
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quality inspection: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create quality inspection")

@router.put("/inspections/{inspection_id}", response_model=QualityInspectionResponse)
async def update_quality_inspection_endpoint(
    inspection_id: str,
    inspection_data: QualityInspectionUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Update quality inspection"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict, excluding None values
        update_dict = {k: v for k, v in inspection_data.dict().items() if v is not None}
        
        inspection = update_quality_inspection(db, inspection_id, update_dict, tenant_id)
        if not inspection:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality inspection not found")
        
        return inspection
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating quality inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update quality inspection")

@router.delete("/inspections/{inspection_id}")
async def delete_quality_inspection_endpoint(
    inspection_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Delete quality inspection"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        success = delete_quality_inspection(db, inspection_id, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality inspection not found")
        
        return {"message": "Quality inspection deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quality inspection {inspection_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete quality inspection")

# Quality Defect endpoints
@router.get("/defects", response_model=List[QualityDefectResponse])
async def get_quality_defects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    assigned_to_id: Optional[str] = Query(None),
    detected_date_from: Optional[datetime] = Query(None),
    detected_date_to: Optional[datetime] = Query(None),
    cost_impact_min: Optional[float] = Query(None),
    cost_impact_max: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get all quality defects with optional filtering"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        if severity:
            defects = get_quality_defects_by_severity(severity, db, tenant_id, skip, limit)
        elif status:
            defects = get_quality_defects_by_status(status, db, tenant_id, skip, limit)
        else:
            # Get all defects and apply filters
            defects = []
            # This would need to be implemented in the CRUD layer
        
        return defects
    except Exception as e:
        logger.error(f"Error getting quality defects: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality defects")

@router.get("/defects/{defect_id}", response_model=QualityDefectResponse)
async def get_quality_defect(
    defect_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get quality defect by ID"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        defect = get_quality_defect_by_id(db, defect_id, tenant_id)
        if not defect:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality defect not found")
        
        return defect
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality defect {defect_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality defect")

@router.post("/defects", response_model=QualityDefectResponse)
async def create_quality_defect_endpoint(
    defect_data: QualityDefectCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Create a new quality defect"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict
        defect_dict = defect_data.dict()
        
        defect = create_quality_defect(db, defect_dict, tenant_id)
        return defect
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quality defect: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create quality defect")

@router.put("/defects/{defect_id}", response_model=QualityDefectResponse)
async def update_quality_defect_endpoint(
    defect_id: str,
    defect_data: QualityDefectUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Update quality defect"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict, excluding None values
        update_dict = {k: v for k, v in defect_data.dict().items() if v is not None}
        
        defect = update_quality_defect(db, defect_id, update_dict, tenant_id)
        if not defect:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality defect not found")
        
        return defect
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating quality defect {defect_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update quality defect")

@router.delete("/defects/{defect_id}")
async def delete_quality_defect_endpoint(
    defect_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Delete quality defect"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        success = delete_quality_defect(db, defect_id, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality defect not found")
        
        return {"message": "Quality defect deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quality defect {defect_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete quality defect")

# Quality Report endpoints
@router.get("/reports", response_model=List[QualityReportResponse])
async def get_quality_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    report_type: Optional[str] = Query(None),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get all quality reports with optional filtering"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        
        if report_type:
            reports = get_quality_reports_by_type(report_type, db, tenant_id, skip, limit)
        else:
            # Get all reports
            reports = []
            # This would need to be implemented in the CRUD layer
        
        return reports
    except Exception as e:
        logger.error(f"Error getting quality reports: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality reports")

@router.get("/reports/{report_id}", response_model=QualityReportResponse)
async def get_quality_report(
    report_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get quality report by ID"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        report = get_quality_report_by_id(db, report_id, tenant_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality report not found")
        
        return report
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality report {report_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality report")

@router.post("/reports", response_model=QualityReportResponse)
async def create_quality_report_endpoint(
    report_data: QualityReportCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Create a new quality report"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict
        report_dict = report_data.dict()
        
        report = create_quality_report(db, report_dict, tenant_id)
        return report
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quality report: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create quality report")

@router.put("/reports/{report_id}", response_model=QualityReportResponse)
async def update_quality_report_endpoint(
    report_id: str,
    report_data: QualityReportUpdate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Update quality report"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        # Convert Pydantic model to dict, excluding None values
        update_dict = {k: v for k, v in report_data.dict().items() if v is not None}
        
        report = update_quality_report(db, report_id, update_dict, tenant_id)
        if not report:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality report not found")
        
        return report
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating quality report {report_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update quality report")

@router.delete("/reports/{report_id}")
async def delete_quality_report_endpoint(
    report_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Delete quality report"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        success = delete_quality_report(db, report_id, tenant_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quality report not found")
        
        return {"message": "Quality report deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting quality report {report_id}: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete quality report")

# Dashboard and Statistics endpoints
@router.get("/dashboard")
async def get_quality_dashboard(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get quality control dashboard data"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        stats = get_quality_dashboard_stats(db, tenant_id)
        recent_checks = get_recent_quality_checks(db, tenant_id, 5)
        upcoming_checks = get_upcoming_quality_checks(db, tenant_id, 5)
        critical_defects = get_critical_defects(db, tenant_id, 5)
        
        return {
            "stats": stats,
            "recent_checks": recent_checks,
            "upcoming_checks": upcoming_checks,
            "critical_defects": critical_defects
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality dashboard: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality dashboard")

@router.get("/stats")
async def get_quality_statistics(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get quality control statistics"""
    try:
        tenant_id = tenant_context["tenant_id"] if tenant_context else None
        if not tenant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenant context required")
        
        stats = get_quality_dashboard_stats(db, tenant_id)
        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting quality statistics: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to get quality statistics")
