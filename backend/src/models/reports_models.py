from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class WorkOrderMetrics(BaseModel):
    total_work_orders: int
    completed_work_orders: int
    in_progress_work_orders: int
    on_hold_work_orders: int
    draft_work_orders: int
    urgent_work_orders: int
    average_completion_time: float
    total_hours_logged: float
    completion_rate: float

class ProjectMetrics(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    overdue_projects: int
    total_project_value: float
    average_project_duration: float

class HRMMetrics(BaseModel):
    total_employees: int
    active_employees: int
    total_job_postings: int
    active_job_postings: int
    pending_applications: int
    pending_leave_requests: int

class InventoryMetrics(BaseModel):
    total_products: int
    low_stock_products: int
    out_of_stock_products: int
    total_warehouses: int
    total_stock_value: float
    pending_purchase_orders: int

class FinancialMetrics(BaseModel):
    total_revenue: float
    total_expenses: float
    net_profit: float
    outstanding_invoices: float
    paid_invoices: int
    overdue_invoices: int

class MonthlyTrend(BaseModel):
    month: str
    value: float
    count: int

class DepartmentPerformance(BaseModel):
    department: str
    completed_tasks: int
    total_tasks: int
    completion_rate: float
    average_time: float

class ReportsDashboard(BaseModel):
    work_orders: WorkOrderMetrics
    projects: ProjectMetrics
    hrm: HRMMetrics
    inventory: InventoryMetrics
    financial: FinancialMetrics
    monthly_trends: List[MonthlyTrend]
    department_performance: List[DepartmentPerformance]
    recent_activities: List[Dict[str, Any]]

class ReportsFilters(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    department: Optional[str] = None
    project_id: Optional[str] = None
    user_id: Optional[str] = None

