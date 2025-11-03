from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateLeaveRequestCommand(ICommand):
    tenant_id: str
    leaverequest_id: str
    approvedAt: Optional[datetime] = None
    approvedBy: Optional[str] = None
    comments: Optional[str] = None
    createdBy: Optional[str] = None
    days: Optional[int] = None
    employeeId: Optional[str] = None
    endDate: Optional[date] = None
    leaveType: Optional[str] = None
    reason: Optional[str] = None
    rejectionReason: Optional[str] = None
    startDate: Optional[date] = None
    status: Optional[str] = None
