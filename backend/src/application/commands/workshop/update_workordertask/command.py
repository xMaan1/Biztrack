from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateWorkOrderTaskCommand(ICommand):
    tenant_id: str
    workordertask_id: str
    actual_hours: Optional[float] = None
    assigned_to_id: Optional[str] = None
    attachments: Optional[List[str]] = None
    completed_at: Optional[datetime] = None
    completion_percentage: Optional[float] = None
    description: Optional[str] = None
    estimated_hours: Optional[float] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    sequence_number: Optional[int] = None
    started_at: Optional[datetime] = None
    status: Optional[str] = None
    title: Optional[str] = None
    work_order_id: Optional[str] = None
