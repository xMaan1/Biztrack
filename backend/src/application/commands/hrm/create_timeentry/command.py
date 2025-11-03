from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateTimeEntryCommand(ICommand):
    tenant_id: str
    approvedAt: datetime
    approvedBy: str
    date: date
    description: str
    employeeId: str
    endTime: datetime
    hours: float
    isApproved: Optional[bool] = False
    projectId: str
    startTime: datetime
    taskId: str
    created_by: Optional[str] = None
