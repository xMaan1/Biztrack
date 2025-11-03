from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateFinancialPeriodCommand(ICommand):
    tenant_id: str
    financialperiod_id: str
    closed_at: Optional[datetime] = None
    closed_by: Optional[str] = None
    created_by: Optional[str] = None
    end_date: Optional[datetime] = None
    is_closed: Optional[bool] = None
    net_income: Optional[float] = None
    notes: Optional[str] = None
    period_name: Optional[str] = None
    start_date: Optional[datetime] = None
    total_expenses: Optional[float] = None
    total_revenue: Optional[float] = None
