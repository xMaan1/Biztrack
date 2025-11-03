from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateMaintenanceWorkOrderCommand(ICommand):
    tenant_id: str
    actual_duration_hours: float
    approval_required: Optional[bool] = False
    approved_by_id: str
    created_by_id: str
    documents: Optional[List[str]] = None
    end_time: datetime
    issues_encountered: Optional[List[str]] = None
    maintenance_schedule_id: str
    notes: str
    parts_used: Optional[List[str]] = None
    photos: Optional[List[str]] = None
    quality_checks: Optional[List[str]] = None
    solutions_applied: Optional[List[str]] = None
    start_time: datetime
    status: str
    technician_id: str
    tools_used: Optional[List[str]] = None
    updated_by_id: str
    work_performed: Optional[List[str]] = None
    created_by: Optional[str] = None
