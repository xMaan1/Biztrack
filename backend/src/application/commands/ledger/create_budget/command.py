from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateBudgetCommand(ICommand):
    tenant_id: str
    allocated_amount: Optional[float] = 0.0
    budget_name: str
    budget_type: str
    created_by: str
    description: Optional[str] = None
    end_date: datetime
    is_active: Optional[bool] = False
    notes: Optional[str] = None
    remaining_amount: Optional[float] = 0.0
    spent_amount: Optional[float] = 0.0
    start_date: datetime
    status: Optional[str] = None
    total_budget: float
    created_by: Optional[str] = None
