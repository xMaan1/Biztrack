from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateMaintenanceWorkOrderCommand(ICommand):
    tenant_id: str
    maintenanceworkorder_id: str
    actual_duration_hours: Optional[float] = None
    approval_required: Optional[bool] = None
    approved_by_id: Optional[str] = None
    created_by_id: Optional[str] = None
    documents: Optional[List[str]] = None
    end_time: Optional[datetime] = None
    issues_encountered: Optional[List[str]] = None
    maintenance_schedule_id: Optional[str] = None
    notes: Optional[str] = None
    parts_used: Optional[List[str]] = None
    photos: Optional[List[str]] = None
    quality_checks: Optional[List[str]] = None
    solutions_applied: Optional[List[str]] = None
    start_time: Optional[datetime] = None
    status: Optional[str] = None
    technician_id: Optional[str] = None
    tools_used: Optional[List[str]] = None
    updated_by_id: Optional[str] = None
    work_performed: Optional[List[str]] = None
