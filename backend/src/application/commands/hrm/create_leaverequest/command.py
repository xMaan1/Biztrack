from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateLeaveRequestCommand(ICommand):
    tenant_id: str
    approvedAt: datetime
    approvedBy: str
    comments: str
    createdBy: str
    days: int
    employeeId: str
    endDate: date
    leaveType: str
    reason: str
    rejectionReason: Optional[str] = None
    startDate: date
    status: Optional[str] = None
    created_by: Optional[str] = None
