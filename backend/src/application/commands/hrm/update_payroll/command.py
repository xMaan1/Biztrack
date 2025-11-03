from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdatePayrollCommand(ICommand):
    tenant_id: str
    payroll_id: str
    allowances: Optional[float] = None
    baseSalary: Optional[float] = None
    bonuses: Optional[float] = None
    createdBy: Optional[str] = None
    deductions: Optional[float] = None
    employeeId: Optional[str] = None
    endDate: Optional[date] = None
    isProcessed: Optional[bool] = None
    netPay: Optional[float] = None
    notes: Optional[str] = None
    overtimeHours: Optional[float] = None
    overtimeRate: Optional[float] = None
    payPeriod: Optional[str] = None
    processedAt: Optional[datetime] = None
    startDate: Optional[date] = None
