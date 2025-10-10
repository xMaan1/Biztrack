from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc, and_, DateTime
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..core.cache import cached_sync

# Import models
from .workshop_models import WorkOrder, WorkOrderStatus, WorkOrderPriority
from .hrm_models import JobPosting, Application, Employee, LeaveRequest
from .inventory_models import Product, Warehouse, PurchaseOrder
from .invoice_models import Invoice, Payment
from .project_models import Project, Task

@cached_sync(ttl=60, key_prefix="reports_dashboard_")
def get_reports_dashboard_data(db: Session, tenant_id: str) -> Dict[str, Any]:
    """Get comprehensive reports dashboard data"""
    
    # Work Order Metrics
    work_order_stats = db.query(
        func.count(WorkOrder.id).label('total'),
        func.sum(case((WorkOrder.status == WorkOrderStatus.COMPLETED, 1), else_=0)).label('completed'),
        func.sum(case((WorkOrder.status == WorkOrderStatus.IN_PROGRESS, 1), else_=0)).label('in_progress'),
        func.sum(case((WorkOrder.status == WorkOrderStatus.ON_HOLD, 1), else_=0)).label('on_hold'),
        func.sum(case((WorkOrder.status == WorkOrderStatus.DRAFT, 1), else_=0)).label('draft'),
        func.sum(case((WorkOrder.priority == WorkOrderPriority.URGENT, 1), else_=0)).label('urgent'),
        func.sum(WorkOrder.actual_hours).label('total_hours'),
        func.avg(WorkOrder.completion_percentage).label('avg_completion')
    ).filter(
        WorkOrder.tenant_id == tenant_id,
        WorkOrder.is_active == True
    ).first()
    
    # Calculate completion rate
    completion_rate = 0.0
    if work_order_stats.total and work_order_stats.total > 0:
        completion_rate = (work_order_stats.completed or 0) / work_order_stats.total * 100
    
    work_order_metrics = {
        "total_work_orders": work_order_stats.total or 0,
        "completed_work_orders": work_order_stats.completed or 0,
        "in_progress_work_orders": work_order_stats.in_progress or 0,
        "on_hold_work_orders": work_order_stats.on_hold or 0,
        "draft_work_orders": work_order_stats.draft or 0,
        "urgent_work_orders": work_order_stats.urgent or 0,
        "average_completion_time": 0.0,  # Placeholder
        "total_hours_logged": work_order_stats.total_hours or 0.0,
        "completion_rate": completion_rate
    }
    
    # Project Metrics
    project_stats = db.query(
        func.count(Project.id).label('total'),
        func.sum(case((Project.status == 'active', 1), else_=0)).label('active'),
        func.sum(case((Project.status == 'completed', 1), else_=0)).label('completed'),
        func.sum(case((Project.endDate < datetime.utcnow().strftime('%Y-%m-%d'), 1), else_=0)).label('overdue'),
        func.sum(Project.budget).label('total_value'),
        func.avg(0).label('avg_duration')
    ).filter(Project.tenant_id == tenant_id).first()
    
    project_metrics = {
        "total_projects": project_stats.total or 0,
        "active_projects": project_stats.active or 0,
        "completed_projects": project_stats.completed or 0,
        "overdue_projects": project_stats.overdue or 0,
        "total_project_value": project_stats.total_value or 0.0,
        "average_project_duration": project_stats.avg_duration or 0.0
    }
    
    # HRM Metrics
    hrm_stats = db.query(
        func.count(Employee.id).label('total_employees'),
        func.sum(case((Employee.isActive == True, 1), else_=0)).label('active_employees'),
        func.count(JobPosting.id).label('total_job_postings'),
        func.sum(case((JobPosting.isActive == True, 1), else_=0)).label('active_job_postings'),
        func.count(Application.id).label('total_applications'),
        func.sum(case((Application.status == 'pending', 1), else_=0)).label('pending_applications'),
        func.sum(case((LeaveRequest.status == 'pending', 1), else_=0)).label('pending_leave_requests')
    ).filter(
        and_(
            Employee.tenant_id == tenant_id,
            JobPosting.tenant_id == tenant_id,
            Application.tenant_id == tenant_id,
            LeaveRequest.tenant_id == tenant_id
        )
    ).first()
    
    hrm_metrics = {
        "total_employees": hrm_stats.total_employees or 0,
        "active_employees": hrm_stats.active_employees or 0,
        "total_job_postings": hrm_stats.total_job_postings or 0,
        "active_job_postings": hrm_stats.active_job_postings or 0,
        "pending_applications": hrm_stats.pending_applications or 0,
        "pending_leave_requests": hrm_stats.pending_leave_requests or 0
    }
    
    # Inventory Metrics
    inventory_stats = db.query(
        func.count(Product.id).label('total_products'),
        func.sum(case((Product.stockQuantity <= Product.minStockLevel, 1), else_=0)).label('low_stock'),
        func.sum(case((Product.stockQuantity == 0, 1), else_=0)).label('out_of_stock'),
        func.count(Warehouse.id).label('total_warehouses'),
        func.sum(Product.stockQuantity * Product.costPrice).label('total_stock_value'),
        func.sum(case((PurchaseOrder.status.in_(['draft', 'submitted', 'approved']), 1), else_=0)).label('pending_orders')
    ).filter(
        and_(
            Product.tenant_id == tenant_id,
            Warehouse.tenant_id == tenant_id,
            PurchaseOrder.tenant_id == tenant_id
        )
    ).first()
    
    inventory_metrics = {
        "total_products": inventory_stats.total_products or 0,
        "low_stock_products": inventory_stats.low_stock or 0,
        "out_of_stock_products": inventory_stats.out_of_stock or 0,
        "total_warehouses": inventory_stats.total_warehouses or 0,
        "total_stock_value": inventory_stats.total_stock_value or 0.0,
        "pending_purchase_orders": inventory_stats.pending_orders or 0
    }
    
    # Financial Metrics
    financial_stats = db.query(
        func.sum(Invoice.total).label('total_revenue'),
        func.sum(Payment.amount).label('total_expenses'),
        func.sum(case((Invoice.status == 'paid', Invoice.total), else_=0)).label('paid_amount'),
        func.sum(case((Invoice.status == 'overdue', Invoice.total), else_=0)).label('outstanding_amount'),
        func.count(case((Invoice.status == 'paid', 1), else_=None)).label('paid_invoices'),
        func.count(case((Invoice.status == 'overdue', 1), else_=None)).label('overdue_invoices')
    ).filter(
        and_(
            Invoice.tenant_id == tenant_id,
            Payment.tenant_id == tenant_id
        )
    ).first()
    
    net_profit = (financial_stats.total_revenue or 0) - (financial_stats.total_expenses or 0)
    
    financial_metrics = {
        "total_revenue": financial_stats.total_revenue or 0.0,
        "total_expenses": financial_stats.total_expenses or 0.0,
        "net_profit": net_profit,
        "outstanding_invoices": financial_stats.outstanding_amount or 0.0,
        "paid_invoices": financial_stats.paid_invoices or 0,
        "overdue_invoices": financial_stats.overdue_invoices or 0
    }
    
    # Monthly Trends (last 12 months) - Optimized single query
    twelve_months_ago = datetime.utcnow().replace(day=1) - timedelta(days=365)
    
    monthly_stats = db.query(
        func.date_trunc('month', WorkOrder.created_at).label('month'),
        func.count(WorkOrder.id).label('count'),
        func.sum(WorkOrder.actual_hours).label('hours')
    ).filter(
        and_(
            WorkOrder.tenant_id == tenant_id,
            WorkOrder.created_at >= twelve_months_ago
        )
    ).group_by(func.date_trunc('month', WorkOrder.created_at)).all()
    
    # Create a dictionary for quick lookup
    monthly_data = {row.month.strftime("%Y-%m"): {"count": row.count, "hours": row.hours or 0.0} for row in monthly_stats}
    
    # Fill in missing months with zeros
    monthly_trends = []
    for i in range(12):
        month_start = datetime.utcnow().replace(day=1) - timedelta(days=30*i)
        month_key = month_start.strftime("%Y-%m")
        
        if month_key in monthly_data:
            monthly_trends.append({
                "month": month_key,
                "value": monthly_data[month_key]["hours"],
                "count": monthly_data[month_key]["count"]
            })
        else:
            monthly_trends.append({
                "month": month_key,
                "value": 0.0,
                "count": 0
            })
    
    # Department Performance (placeholder - would need department field in models)
    department_performance = [
        {
            "department": "Production",
            "completed_tasks": 45,
            "total_tasks": 60,
            "completion_rate": 75.0,
            "average_time": 2.5
        },
        {
            "department": "Maintenance",
            "completed_tasks": 32,
            "total_tasks": 40,
            "completion_rate": 80.0,
            "average_time": 1.8
        },
        {
            "department": "Quality Control",
            "completed_tasks": 28,
            "total_tasks": 35,
            "completion_rate": 80.0,
            "average_time": 1.2
        }
    ]
    
    # Recent Activities - Optimized query with only needed fields
    recent_work_orders = db.query(
        WorkOrder.id,
        WorkOrder.title,
        WorkOrder.status,
        WorkOrder.updated_at,
        WorkOrder.work_order_number
    ).filter(
        WorkOrder.tenant_id == tenant_id
    ).order_by(WorkOrder.updated_at.desc()).limit(5).all()
    
    recent_activities = []
    for wo in recent_work_orders:
        recent_activities.append({
            "id": str(wo.id),
            "type": "work_order",
            "title": wo.title,
            "status": wo.status,
            "updated_at": wo.updated_at.isoformat(),
            "description": f"Work order {wo.work_order_number} updated"
        })
    
    return {
        "work_orders": work_order_metrics,
        "projects": project_metrics,
        "hrm": hrm_metrics,
        "inventory": inventory_metrics,
        "financial": financial_metrics,
        "monthly_trends": monthly_trends,
        "department_performance": department_performance,
        "recent_activities": recent_activities
    }

@cached_sync(ttl=60, key_prefix="work_order_analytics_")
def get_work_order_analytics(db: Session, tenant_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get detailed work order analytics"""
    
    query = db.query(WorkOrder).filter(WorkOrder.tenant_id == tenant_id)
    
    if filters:
        if filters.get('start_date'):
            query = query.filter(WorkOrder.created_at >= filters['start_date'])
        if filters.get('end_date'):
            query = query.filter(WorkOrder.created_at <= filters['end_date'])
        if filters.get('user_id'):
            query = query.filter(WorkOrder.assigned_to_id == filters['user_id'])
    
    work_orders = query.all()
    
    # Status distribution
    status_distribution = {}
    priority_distribution = {}
    type_distribution = {}
    
    total_hours = 0
    total_cost = 0
    
    for wo in work_orders:
        # Status distribution
        status_distribution[wo.status] = status_distribution.get(wo.status, 0) + 1
        
        # Priority distribution
        priority_distribution[wo.priority] = priority_distribution.get(wo.priority, 0) + 1
        
        # Type distribution
        type_distribution[wo.work_order_type] = type_distribution.get(wo.work_order_type, 0) + 1
        
        # Totals
        total_hours += wo.actual_hours or 0
        total_cost += wo.estimated_cost or 0
    
    return {
        "total_work_orders": len(work_orders),
        "status_distribution": status_distribution,
        "priority_distribution": priority_distribution,
        "type_distribution": type_distribution,
        "total_hours": total_hours,
        "total_cost": total_cost,
        "average_hours_per_order": total_hours / len(work_orders) if work_orders else 0,
        "average_cost_per_order": total_cost / len(work_orders) if work_orders else 0
    }

@cached_sync(ttl=60, key_prefix="project_analytics_")
def get_project_analytics(db: Session, tenant_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get detailed project analytics"""
    
    query = db.query(Project).filter(Project.tenant_id == tenant_id)
    
    if filters:
        if filters.get('start_date'):
            query = query.filter(Project.startDate >= filters['start_date'])
        if filters.get('end_date'):
            query = query.filter(Project.endDate <= filters['end_date'])
    
    projects = query.all()
    
    # Status distribution
    status_distribution = {}
    total_budget = 0
    total_duration = 0
    
    for project in projects:
        status_distribution[project.status] = status_distribution.get(project.status, 0) + 1
        total_budget += project.budget or 0
        
        if project.startDate and project.endDate:
            try:
                start_date = datetime.strptime(project.startDate, '%Y-%m-%d')
                end_date = datetime.strptime(project.endDate, '%Y-%m-%d')
                duration = (end_date - start_date).days
                total_duration += duration
            except (ValueError, TypeError):
                pass
    
    return {
        "total_projects": len(projects),
        "status_distribution": status_distribution,
        "total_budget": total_budget,
        "average_budget": total_budget / len(projects) if projects else 0,
        "average_duration": total_duration / len(projects) if projects else 0
    }

@cached_sync(ttl=60, key_prefix="financial_analytics_")
def get_financial_analytics(db: Session, tenant_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get detailed financial analytics"""
    
    # Revenue by month
    revenue_query = db.query(
        func.date_trunc('month', Invoice.createdAt).label('month'),
        func.sum(Invoice.total).label('revenue'),
        func.count(Invoice.id).label('count')
    ).filter(Invoice.tenant_id == tenant_id)
    
    if filters:
        if filters.get('start_date'):
            revenue_query = revenue_query.filter(Invoice.createdAt >= filters['start_date'])
        if filters.get('end_date'):
            revenue_query = revenue_query.filter(Invoice.createdAt <= filters['end_date'])
    
    revenue_data = revenue_query.group_by(func.date_trunc('month', Invoice.createdAt)).all()
    
    # Expenses by month
    expense_query = db.query(
        func.date_trunc('month', Payment.createdAt).label('month'),
        func.sum(Payment.amount).label('expenses'),
        func.count(Payment.id).label('count')
    ).filter(Payment.tenant_id == tenant_id)
    
    if filters:
        if filters.get('start_date'):
            expense_query = expense_query.filter(Payment.createdAt >= filters['start_date'])
        if filters.get('end_date'):
            expense_query = expense_query.filter(Payment.createdAt <= filters['end_date'])
    
    expense_data = expense_query.group_by(func.date_trunc('month', Payment.createdAt)).all()
    
    return {
        "revenue_by_month": [
            {
                "month": row.month.strftime("%Y-%m"),
                "revenue": float(row.revenue or 0),
                "count": row.count
            } for row in revenue_data
        ],
        "expenses_by_month": [
            {
                "month": row.month.strftime("%Y-%m"),
                "expenses": float(row.expenses or 0),
                "count": row.count
            } for row in expense_data
        ]
    }
