from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdatePOSShiftCommand(ICommand):
    tenant_id: str
    posshift_id: str
    closingAmount: Optional[float] = None
    employeeId: Optional[str] = None
    endTime: Optional[datetime] = None
    notes: Optional[str] = None
    openingAmount: Optional[float] = None
    shiftNumber: Optional[str] = None
    startTime: Optional[datetime] = None
    status: Optional[str] = None
    totalSales: Optional[float] = None
    totalTransactions: Optional[int] = None
