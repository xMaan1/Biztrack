from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateWorkOrderTaskCommand(ICommand):
    tenant_id: str
    actual_hours: Optional[float] = 0.0
    assigned_to_id: str
    attachments: Optional[List[str]] = None
    completed_at: datetime
    completion_percentage: Optional[float] = 0.0
    description: str
    estimated_hours: Optional[float] = 0.0
    is_active: Optional[bool] = False
    notes: str
    sequence_number: Optional[int] = 0
    started_at: datetime
    status: Optional[str] = None
    title: str
    work_order_id: str
    created_by: Optional[str] = None
