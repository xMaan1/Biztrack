from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateMaintenanceReportCommand(ICommand):
    tenant_id: str
    approval_status: str
    approved_by_id: str
    compliance_notes: Optional[List[str]] = None
    cost_breakdown: Optional[List[str]] = None
    created_by_id: str
    description: str
    documents: Optional[List[str]] = None
    efficiency_improvement: float
    equipment_id: str
    issues_found: Optional[List[str]] = None
    maintenance_type: str
    maintenance_work_order_id: str
    next_maintenance_date: datetime
    parts_replaced: Optional[List[str]] = None
    photos: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    report_date: datetime
    safety_improvements: Optional[List[str]] = None
    technician_id: str
    title: str
    tools_used: Optional[List[str]] = None
    total_cost: Optional[float] = 0.0
    updated_by_id: str
    work_summary: str
    created_by: Optional[str] = None
