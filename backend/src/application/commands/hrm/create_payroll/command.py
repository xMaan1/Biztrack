from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreatePayrollCommand(ICommand):
    tenant_id: str
    allowances: Optional[float] = 0.0
    baseSalary: float
    bonuses: Optional[float] = 0.0
    createdBy: str
    deductions: Optional[float] = 0.0
    employeeId: str
    endDate: date
    isProcessed: Optional[bool] = False
    netPay: float
    notes: Optional[str] = None
    overtimeHours: Optional[float] = 0.0
    overtimeRate: Optional[float] = 0.0
    payPeriod: str
    processedAt: datetime
    startDate: date
    created_by: Optional[str] = None
