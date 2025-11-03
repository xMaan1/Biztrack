from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateFinancialPeriodCommand(ICommand):
    tenant_id: str
    closed_at: Optional[datetime] = None
    closed_by: str
    created_by: str
    end_date: datetime
    is_closed: Optional[bool] = False
    net_income: Optional[float] = 0.0
    notes: Optional[str] = None
    period_name: str
    start_date: datetime
    total_expenses: Optional[float] = 0.0
    total_revenue: Optional[float] = 0.0
    created_by: Optional[str] = None
