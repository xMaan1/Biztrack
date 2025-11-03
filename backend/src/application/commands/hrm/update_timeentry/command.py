from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateTimeEntryCommand(ICommand):
    tenant_id: str
    timeentry_id: str
    approvedAt: Optional[datetime] = None
    approvedBy: Optional[str] = None
    date: Optional[date] = None
    description: Optional[str] = None
    employeeId: Optional[str] = None
    endTime: Optional[datetime] = None
    hours: Optional[float] = None
    isApproved: Optional[bool] = None
    projectId: Optional[str] = None
    startTime: Optional[datetime] = None
    taskId: Optional[str] = None
