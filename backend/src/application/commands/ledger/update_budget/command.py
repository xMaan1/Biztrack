from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateBudgetCommand(ICommand):
    tenant_id: str
    budget_id: str
    allocated_amount: Optional[float] = None
    budget_name: Optional[str] = None
    budget_type: Optional[str] = None
    created_by: Optional[str] = None
    description: Optional[str] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    remaining_amount: Optional[float] = None
    spent_amount: Optional[float] = None
    start_date: Optional[datetime] = None
    status: Optional[str] = None
    total_budget: Optional[float] = None
