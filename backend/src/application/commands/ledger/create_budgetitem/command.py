from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateBudgetItemCommand(ICommand):
    tenant_id: str
    account_id: str
    allocated_amount: Optional[float] = 0.0
    budget_id: str
    budgeted_amount: float
    notes: Optional[str] = None
    remaining_amount: Optional[float] = 0.0
    spent_amount: Optional[float] = 0.0
    created_by: Optional[str] = None
