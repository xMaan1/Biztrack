from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreatePOSShiftCommand(ICommand):
    tenant_id: str
    closingAmount: Optional[float] = 0.0
    employeeId: str
    endTime: Optional[datetime] = None
    notes: Optional[str] = None
    openingAmount: Optional[float] = 0.0
    shiftNumber: str
    startTime: datetime
    status: Optional[str] = None
    totalSales: Optional[float] = 0.0
    totalTransactions: Optional[int] = 0
    created_by: Optional[str] = None
