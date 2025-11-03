from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateMaintenanceReportCommand(ICommand):
    tenant_id: str
    maintenancereport_id: str
    approval_status: Optional[str] = None
    approved_by_id: Optional[str] = None
    compliance_notes: Optional[List[str]] = None
    cost_breakdown: Optional[List[str]] = None
    created_by_id: Optional[str] = None
    description: Optional[str] = None
    documents: Optional[List[str]] = None
    efficiency_improvement: Optional[float] = None
    equipment_id: Optional[str] = None
    issues_found: Optional[List[str]] = None
    maintenance_type: Optional[str] = None
    maintenance_work_order_id: Optional[str] = None
    next_maintenance_date: Optional[datetime] = None
    parts_replaced: Optional[List[str]] = None
    photos: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    report_date: Optional[datetime] = None
    safety_improvements: Optional[List[str]] = None
    technician_id: Optional[str] = None
    title: Optional[str] = None
    tools_used: Optional[List[str]] = None
    total_cost: Optional[float] = None
    updated_by_id: Optional[str] = None
    work_summary: Optional[str] = None
