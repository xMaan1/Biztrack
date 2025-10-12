from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc, and_, DateTime
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..core.cache import cached_sync

# Import models
from .workshop_models import WorkOrder, WorkOrderStatus, WorkOrderPriority
from .hrm_models import Employee, LeaveRequest
from .inventory_models import Product, Warehouse, PurchaseOrder
from .invoice_models import Invoice, Payment
from .project_models import Project, Task
from .core_models import User
from .pos_models import POSTransaction

@cached_sync(ttl=60, key_prefix="reports_dashboard_")
def get_reports_dashboard_data(db: Session, tenant_id: str, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Get comprehensive reports dashboard data using real database queries"""
    
    if filters is None:
        filters = {}
    
    # Build date filter conditions
    date_conditions = []
    if 'start_date' in filters:
        date_conditions.append(func.date(WorkOrder.created_at) >= filters['start_date'].date())
    if 'end_date' in filters:
        date_conditions.append(func.date(WorkOrder.created_at) <= filters['end_date'].date())
    
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
        WorkOrder.is_active == True,
        *date_conditions
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
        "average_completion_time": 0.0,  
        "total_hours_logged": work_order_stats.total_hours or 0.0,
        "completion_rate": completion_rate
    }
    
    # Project Metrics
    project_date_conditions = []
    if 'start_date' in filters:
        project_date_conditions.append(func.date(Project.createdAt) >= filters['start_date'].date())
    if 'end_date' in filters:
        project_date_conditions.append(func.date(Project.createdAt) <= filters['end_date'].date())
    
    project_stats = db.query(
        func.count(Project.id).label('total'),
        func.sum(case((Project.status == 'in_progress', 1), else_=0)).label('active'),
        func.sum(case((Project.status == 'completed', 1), else_=0)).label('completed'),
        func.sum(case((Project.status == 'on_hold', 1), else_=0)).label('on_hold'),
        func.sum(case((Project.status == 'cancelled', 1), else_=0)).label('cancelled'),
        func.avg(Project.completionPercent).label('avg_progress')
    ).filter(
        Project.tenant_id == tenant_id,
        *project_date_conditions
    ).first()
    
    project_metrics = {
        "total_projects": project_stats.total or 0,
        "active_projects": project_stats.active or 0,
        "completed_projects": project_stats.completed or 0,
        "overdue_projects": 0,  # Placeholder - would need due date logic
        "total_project_value": 0.0,  # Placeholder - would need budget tracking
        "average_project_duration": 0.0  # Placeholder - would need duration calculation
    }
    
    # HRM Metrics
    employee_stats = db.query(
        func.count(Employee.id).label('total'),
        func.sum(case((Employee.isActive == True, 1), else_=0)).label('active'),
        func.sum(case((Employee.isActive == False, 1), else_=0)).label('inactive')
    ).filter(
        Employee.tenant_id == tenant_id
    ).first()
    
    hrm_metrics = {
        "total_employees": employee_stats.total or 0,
        "active_employees": employee_stats.active or 0,
        "total_job_postings": 0,  # Placeholder - would need job postings query
        "active_job_postings": 0,  # Placeholder - would need job postings query
        "pending_applications": 0,  # Placeholder - would need applications query
        "pending_leave_requests": 0  # Placeholder - would need leave requests query
    }
    
    # Inventory Metrics
    inventory_stats = db.query(
        func.count(Product.id).label('total_products'),
        func.sum(Product.stockQuantity).label('total_stock'),
        func.sum(Product.unitPrice * Product.stockQuantity).label('total_value'),
        func.sum(case((Product.stockQuantity <= Product.minStockLevel, 1), else_=0)).label('low_stock'),
        func.sum(case((Product.stockQuantity == 0, 1), else_=0)).label('out_of_stock')
    ).filter(
        Product.tenant_id == tenant_id
    ).first()
    
    inventory_metrics = {
        "total_products": inventory_stats.total_products or 0,
        "low_stock_products": inventory_stats.low_stock or 0,
        "out_of_stock_products": inventory_stats.out_of_stock or 0,
        "total_warehouses": 0,  # Placeholder - would need warehouse count query
        "total_stock_value": inventory_stats.total_value or 0.0,
        "pending_purchase_orders": 0  # Placeholder - would need purchase orders query
    }
    
    # Financial Metrics
    # Build date conditions for financial data
    invoice_date_conditions = []
    po_date_conditions = []
    if 'start_date' in filters:
        invoice_date_conditions.append(func.date(Invoice.createdAt) >= filters['start_date'].date())
        po_date_conditions.append(func.date(PurchaseOrder.createdAt) >= filters['start_date'].date())
    if 'end_date' in filters:
        invoice_date_conditions.append(func.date(Invoice.createdAt) <= filters['end_date'].date())
        po_date_conditions.append(func.date(PurchaseOrder.createdAt) <= filters['end_date'].date())
    
    # Get total revenue from invoices
    revenue_stats = db.query(
        func.sum(Invoice.total).label('total_revenue'),
        func.sum(case((Invoice.status == 'paid', Invoice.total), else_=0)).label('paid_amount'),
        func.sum(case((Invoice.status == 'sent', Invoice.total), else_=0)).label('pending_amount'),
        func.count(Invoice.id).label('total_invoices')
    ).filter(
        Invoice.tenant_id == tenant_id,
        *invoice_date_conditions
    ).first()
    
    # Get total expenses from purchase orders
    expense_stats = db.query(
        func.sum(PurchaseOrder.totalAmount).label('total_expenses'),
        func.count(PurchaseOrder.id).label('total_orders')
    ).filter(
        PurchaseOrder.tenant_id == tenant_id,
        *po_date_conditions
    ).first()
    
    financial_metrics = {
        "total_revenue": revenue_stats.total_revenue or 0.0,
        "total_expenses": expense_stats.total_expenses or 0.0,
        "net_profit": (revenue_stats.total_revenue or 0) - (expense_stats.total_expenses or 0),
        "outstanding_invoices": revenue_stats.pending_amount or 0.0,
        "paid_invoices": 0,  # Placeholder - would need paid invoice count
        "overdue_invoices": 0  # Placeholder - would need overdue invoice count
    }
    
    # POS Metrics (if applicable)
    pos_date_conditions = []
    if 'start_date' in filters:
        pos_date_conditions.append(func.date(POSTransaction.createdAt) >= filters['start_date'].date())
    if 'end_date' in filters:
        pos_date_conditions.append(func.date(POSTransaction.createdAt) <= filters['end_date'].date())
    
    pos_stats = db.query(
        func.count(POSTransaction.id).label('total_transactions'),
        func.sum(POSTransaction.total).label('total_sales'),
        func.avg(POSTransaction.total).label('avg_transaction'),
        func.sum(case((POSTransaction.paymentMethod == 'cash', POSTransaction.total), else_=0)).label('cash_sales'),
        func.sum(case((POSTransaction.paymentMethod == 'credit_card', POSTransaction.total), else_=0)).label('card_sales')
    ).filter(
        POSTransaction.tenant_id == tenant_id,
        *pos_date_conditions
    ).first()
    
    pos_metrics = {
        "total_transactions": pos_stats.total_transactions or 0,
        "total_sales": pos_stats.total_sales or 0.0,
        "average_transaction_value": pos_stats.avg_transaction or 0.0,
        "cash_sales": pos_stats.cash_sales or 0.0,
        "card_sales": pos_stats.card_sales or 0.0,
        "sales_growth": 0.0  # Calculate from actual data
    }
    
    # Monthly Trends (last 6 months or date range)
    trend_start_date = filters.get('start_date', datetime.now() - timedelta(days=180))
    trend_end_date = filters.get('end_date', datetime.now())
    
    # Project trends
    project_trends = db.query(
        func.date_trunc('month', Project.createdAt).label('month'),
        func.count(Project.id).label('count')
    ).filter(
        Project.tenant_id == tenant_id,
        Project.createdAt >= trend_start_date,
        Project.createdAt <= trend_end_date
    ).group_by(
        func.date_trunc('month', Project.createdAt)
    ).order_by('month').all()
    
    # Work order trends
    work_order_trends = db.query(
        func.date_trunc('month', WorkOrder.created_at).label('month'),
        func.count(WorkOrder.id).label('count')
    ).filter(
        WorkOrder.tenant_id == tenant_id,
        WorkOrder.created_at >= trend_start_date,
        WorkOrder.created_at <= trend_end_date
    ).group_by(
        func.date_trunc('month', WorkOrder.created_at)
    ).order_by('month').all()
    
    # Revenue trends
    revenue_trends = db.query(
        func.date_trunc('month', Invoice.createdAt).label('month'),
        func.sum(Invoice.total).label('amount')
    ).filter(
        Invoice.tenant_id == tenant_id,
        Invoice.createdAt >= trend_start_date,
        Invoice.createdAt <= trend_end_date
    ).group_by(
        func.date_trunc('month', Invoice.createdAt)
    ).order_by('month').all()
    
    monthly_trends = []
    
    # Combine all trends into a single list
    for trend in project_trends:
        monthly_trends.append({
            "month": trend.month.isoformat(),
            "value": float(trend.count),
            "count": trend.count
        })
    
    for trend in work_order_trends:
        monthly_trends.append({
            "month": trend.month.isoformat(),
            "value": float(trend.count),
            "count": trend.count
        })
    
    for trend in revenue_trends:
        monthly_trends.append({
            "month": trend.month.isoformat(),
            "value": float(trend.amount or 0),
            "count": 1
        })
    
    # Department Performance
    department_performance = db.query(
        Employee.department,
        func.count(Employee.id).label('employee_count'),
        func.avg(Employee.salary).label('avg_salary')
    ).filter(
        Employee.tenant_id == tenant_id,
        Employee.department.isnot(None),
        Employee.isActive == True
    ).group_by(
        Employee.department
    ).all()
    
    dept_performance = [
        {
            "department": dept.department,
            "completed_tasks": 0,  # Placeholder - would need task completion query
            "total_tasks": 0,  # Placeholder - would need task count query
            "completion_rate": 0.0,  # Placeholder - would need completion calculation
            "average_time": 0.0  # Placeholder - would need time tracking
        }
        for dept in department_performance
    ]
    
    return {
        "work_orders": work_order_metrics,
        "projects": project_metrics,
        "hrm": hrm_metrics,
        "inventory": inventory_metrics,
        "financial": financial_metrics,
        "monthly_trends": monthly_trends,
        "department_performance": dept_performance,
        "recent_activities": []  # Placeholder - would need activity tracking
    }

def get_work_order_analytics(db: Session, tenant_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get detailed work order analytics"""
    query = db.query(WorkOrder).filter(WorkOrder.tenant_id == tenant_id)
    
    if filters:
        if 'start_date' in filters:
            query = query.filter(WorkOrder.created_at >= filters['start_date'])
        if 'end_date' in filters:
            query = query.filter(WorkOrder.created_at <= filters['end_date'])
    
    work_orders = query.all()
    
    # Calculate detailed metrics
    total_orders = len(work_orders)
    completed_orders = len([wo for wo in work_orders if wo.status == WorkOrderStatus.COMPLETED])
    in_progress_orders = len([wo for wo in work_orders if wo.status == WorkOrderStatus.IN_PROGRESS])
    
    # Priority breakdown
    priority_breakdown = {}
    for wo in work_orders:
        priority = wo.priority.value if wo.priority else 'normal'
        priority_breakdown[priority] = priority_breakdown.get(priority, 0) + 1
    
    # Status breakdown
    status_breakdown = {}
    for wo in work_orders:
        status = wo.status.value if wo.status else 'draft'
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    return {
        "total_work_orders": total_orders,
        "completed_work_orders": completed_orders,
        "in_progress_work_orders": in_progress_orders,
        "completion_rate": (completed_orders / total_orders * 100) if total_orders > 0 else 0,
        "priority_breakdown": priority_breakdown,
        "status_breakdown": status_breakdown,
        "average_completion_time": 0.0,  # Calculate from actual data
        "total_hours_logged": sum(wo.actual_hours or 0 for wo in work_orders)
    }

def get_project_analytics(db: Session, tenant_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get detailed project analytics"""
    query = db.query(Project).filter(Project.tenant_id == tenant_id)
    
    if filters:
        if 'start_date' in filters:
            query = query.filter(Project.createdAt >= filters['start_date'])
        if 'end_date' in filters:
            query = query.filter(Project.createdAt <= filters['end_date'])
    
    projects = query.all()
    
    # Calculate detailed metrics
    total_projects = len(projects)
    active_projects = len([p for p in projects if p.status == 'in_progress'])
    completed_projects = len([p for p in projects if p.status == 'completed'])
    
    # Progress distribution
    progress_ranges = {
        "0-25": len([p for p in projects if 0 <= (p.completionPercent or 0) <= 25]),
        "26-50": len([p for p in projects if 26 <= (p.completionPercent or 0) <= 50]),
        "51-75": len([p for p in projects if 51 <= (p.completionPercent or 0) <= 75]),
        "76-100": len([p for p in projects if 76 <= (p.completionPercent or 0) <= 100])
    }
    
    # Task count per project
    task_counts = []
    for project in projects:
        task_count = db.query(func.count(Task.id)).filter(
            Task.projectId == project.id,
            Task.tenant_id == tenant_id
        ).scalar()
        task_counts.append(task_count or 0)
    
    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "completed_projects": completed_projects,
        "completion_rate": (completed_projects / total_projects * 100) if total_projects > 0 else 0,
        "progress_distribution": progress_ranges,
        "average_progress": sum(p.completionPercent or 0 for p in projects) / total_projects if total_projects > 0 else 0,
        "total_tasks": sum(task_counts),
        "average_tasks_per_project": sum(task_counts) / total_projects if total_projects > 0 else 0
    }

def get_financial_analytics(db: Session, tenant_id: str, filters: Dict[str, Any] = None) -> Dict[str, Any]:
    """Get detailed financial analytics"""
    # Revenue analysis
    invoice_query = db.query(Invoice).filter(Invoice.tenant_id == tenant_id)
    if filters:
        if 'start_date' in filters:
            invoice_query = invoice_query.filter(Invoice.createdAt >= filters['start_date'])
        if 'end_date' in filters:
            invoice_query = invoice_query.filter(Invoice.createdAt <= filters['end_date'])
    
    invoices = invoice_query.all()
    
    # Expense analysis
    expense_query = db.query(PurchaseOrder).filter(PurchaseOrder.tenant_id == tenant_id)
    if filters:
        if 'start_date' in filters:
            expense_query = expense_query.filter(PurchaseOrder.createdAt >= filters['start_date'])
        if 'end_date' in filters:
            expense_query = expense_query.filter(PurchaseOrder.createdAt <= filters['end_date'])
    
    expenses = expense_query.all()
    
    # Calculate metrics
    total_revenue = sum(inv.total or 0 for inv in invoices)
    total_expenses = sum(exp.totalAmount or 0 for exp in expenses)
    net_profit = total_revenue - total_expenses
    
    # Payment status breakdown
    payment_status = {}
    for inv in invoices:
        status = inv.status or 'draft'
        payment_status[status] = payment_status.get(status, 0) + 1
    
    # Monthly revenue trend
    monthly_revenue = {}
    for inv in invoices:
        month_key = inv.createdAt.strftime('%Y-%m') if inv.createdAt else 'unknown'
        monthly_revenue[month_key] = monthly_revenue.get(month_key, 0) + (inv.total or 0)
    
    return {
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "net_profit": net_profit,
        "profit_margin": (net_profit / total_revenue * 100) if total_revenue > 0 else 0,
        "total_invoices": len(invoices),
        "total_expense_orders": len(expenses),
        "payment_status_breakdown": payment_status,
        "monthly_revenue": monthly_revenue,
        "average_invoice_amount": total_revenue / len(invoices) if invoices else 0,
        "average_expense_amount": total_expenses / len(expenses) if expenses else 0
    }