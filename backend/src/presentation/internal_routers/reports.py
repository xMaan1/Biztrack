from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..dependencies import get_current_user, get_tenant_context
from ...config.database import get_db
from ...models.unified_models import (
    User, ReportsDashboard, WorkOrderMetrics, ProjectMetrics, HRMMetrics,
    InventoryMetrics, FinancialMetrics, MonthlyTrend, DepartmentPerformance,
    ReportsFilters
)
from ...config.reports_crud import (
    get_reports_dashboard_data, get_work_order_analytics,
    get_project_analytics, get_financial_analytics
)

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/dashboard", response_model=ReportsDashboard)
def get_reports_dashboard(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get comprehensive reports dashboard data"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        filters = {}
        if start_date:
            filters['start_date'] = datetime.fromisoformat(start_date)
        if end_date:
            filters['end_date'] = datetime.fromisoformat(end_date)
        
        dashboard_data = get_reports_dashboard_data(db, tenant_id, filters)
        
        return ReportsDashboard(**dashboard_data)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Dashboard error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard data: {str(e)}")

@router.get("/work-orders/analytics")
def get_work_order_analytics_endpoint(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get detailed work order analytics"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        filters = {}
        if start_date:
            filters['start_date'] = datetime.fromisoformat(start_date)
        if end_date:
            filters['end_date'] = datetime.fromisoformat(end_date)
        if user_id:
            filters['user_id'] = user_id
        
        analytics_data = get_work_order_analytics(db, tenant_id, filters)
        return {"success": True, "data": analytics_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get work order analytics: {str(e)}")

@router.get("/projects/analytics")
def get_project_analytics_endpoint(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get detailed project analytics"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        filters = {}
        if start_date:
            filters['start_date'] = datetime.fromisoformat(start_date)
        if end_date:
            filters['end_date'] = datetime.fromisoformat(end_date)
        
        analytics_data = get_project_analytics(db, tenant_id, filters)
        return {"success": True, "data": analytics_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get project analytics: {str(e)}")

@router.get("/financial/analytics")
def get_financial_analytics_endpoint(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get detailed financial analytics"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        filters = {}
        if start_date:
            filters['start_date'] = datetime.fromisoformat(start_date)
        if end_date:
            filters['end_date'] = datetime.fromisoformat(end_date)
        
        analytics_data = get_financial_analytics(db, tenant_id, filters)
        return {"success": True, "data": analytics_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get financial analytics: {str(e)}")

@router.get("/summary")
def get_reports_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Get quick summary statistics"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        dashboard_data = get_reports_dashboard_data(db, tenant_id)
        
        # Extract key metrics for quick summary
        summary = {
            "total_work_orders": dashboard_data["work_orders"]["total_work_orders"],
            "completed_work_orders": dashboard_data["work_orders"]["completed_work_orders"],
            "completion_rate": dashboard_data["work_orders"]["completion_rate"],
            "total_projects": dashboard_data["projects"]["total_projects"],
            "active_projects": dashboard_data["projects"]["active_projects"],
            "total_employees": dashboard_data["hrm"]["total_employees"],
            "active_employees": dashboard_data["hrm"]["active_employees"],
            "total_revenue": dashboard_data["financial"]["total_revenue"],
            "net_profit": dashboard_data["financial"]["net_profit"],
            "total_stock_value": dashboard_data["inventory"]["total_stock_value"]
        }
        
        return {"success": True, "summary": summary}
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Summary error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        raise HTTPException(status_code=500, detail=f"Failed to get summary: {str(e)}")

@router.get("/export")
def export_reports(
    report_type: str = Query("dashboard"),
    format: str = Query("json"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_context: dict = Depends(get_tenant_context)
):
    """Export reports data"""
    try:
        tenant_id = str(tenant_context["tenant_id"])
        
        filters = {}
        if start_date:
            filters['start_date'] = datetime.fromisoformat(start_date)
        if end_date:
            filters['end_date'] = datetime.fromisoformat(end_date)
        
        if report_type == "dashboard":
            data = get_reports_dashboard_data(db, tenant_id)
        elif report_type == "work_orders":
            data = get_work_order_analytics(db, tenant_id, filters)
        elif report_type == "projects":
            data = get_project_analytics(db, tenant_id, filters)
        elif report_type == "financial":
            data = get_financial_analytics(db, tenant_id, filters)
        else:
            raise HTTPException(status_code=400, detail="Invalid report type")
        
        return {
            "success": True,
            "data": data,
            "exported_at": datetime.utcnow().isoformat(),
            "format": format,
            "report_type": report_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export reports: {str(e)}")
