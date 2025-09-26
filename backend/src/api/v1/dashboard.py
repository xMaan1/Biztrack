from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from ...config.database import (
    get_db, get_all_projects, get_work_order_stats, get_invoice_dashboard_data,
    get_project_stats, get_all_users
)
from ...api.dependencies import get_tenant_context
from ...core.cache import cached_sync

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview")
@cached_sync(ttl=30, key_prefix="dashboard_overview_")
def get_dashboard_overview(
    db: Session = Depends(get_db),
    tenant_context: Optional[dict] = Depends(get_tenant_context)
):
    """Get comprehensive dashboard data in a single request"""
    try:
        if not tenant_context:
            raise HTTPException(status_code=400, detail="Tenant context required")
        
        tenant_id = tenant_context["tenant_id"]
        
        # Get all data synchronously
        projects_data = get_projects_data(db, tenant_id)
        work_orders_data = get_work_orders_data(db, tenant_id)
        invoices_data = get_invoices_data(db, tenant_id)
        users_data = get_users_data(db, tenant_id)
        subscription_data = get_subscription_data(db, tenant_context)
        
        return {
            "projects": projects_data,
            "workOrders": work_orders_data,
            "invoices": invoices_data,
            "users": users_data,
            "subscription": subscription_data,
            "timestamp": tenant_context.get("timestamp"),
            "tenant_id": tenant_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")

def get_projects_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get projects data with stats"""
    try:
        # Get recent projects (limit to 10 for dashboard)
        projects = get_all_projects(db, tenant_id=tenant_id, skip=0, limit=10)
        
        # Get project statistics
        stats = get_project_stats(db, tenant_id)
        
        return {
            "recent": [
                {
                    "id": str(p.id),
                    "name": p.name,
                    "status": p.status,
                    "priority": p.priority,
                    "completionPercent": p.completionPercent,
                    "createdAt": p.createdAt.isoformat() if p.createdAt else None
                } for p in projects
            ],
            "stats": stats
        }
    except Exception as e:
        return {"recent": [], "stats": {"total": 0, "active": 0, "completed": 0, "on_hold": 0}, "error": str(e)}

def get_work_orders_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get work orders statistics"""
    try:
        stats = get_work_order_stats(db, tenant_id)
        return {"stats": stats}
    except Exception as e:
        return {"stats": {"total": 0, "draft": 0, "planned": 0, "in_progress": 0, "completed": 0, "on_hold": 0, "urgent": 0}, "error": str(e)}

def get_invoices_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get invoices dashboard data"""
    try:
        dashboard_data = get_invoice_dashboard_data(db, tenant_id)
        return dashboard_data
    except Exception as e:
        return {
            "invoices": {"total": 0, "draft": 0, "sent": 0, "paid": 0, "overdue": 0},
            "amounts": {"total": 0, "paid": 0, "outstanding": 0},
            "error": str(e)
        }

def get_users_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get users data"""
    try:
        users = get_all_users(db, tenant_id=tenant_id, skip=0, limit=50)
        return {
            "users": [
                {
                    "id": str(u.id),
                    "name": f"{u.firstName or ''} {u.lastName or ''}".strip() or u.userName,
                    "email": u.email,
                    "role": u.userRole,
                    "isActive": u.isActive
                } for u in users
            ],
            "total": len(users)
        }
    except Exception as e:
        return {"users": [], "total": 0, "error": str(e)}

def get_subscription_data(db: Session, tenant_context: dict) -> Dict[str, Any]:
    """Get subscription data"""
    try:
        # This would typically come from a subscription service
        # For now, return basic tenant info
        return {
            "plan": tenant_context.get("plan", "basic"),
            "status": tenant_context.get("status", "active"),
            "tenant_name": tenant_context.get("tenant_name", "Unknown"),
            "features": tenant_context.get("features", [])
        }
    except Exception as e:
        return {"plan": "basic", "status": "active", "error": str(e)}
