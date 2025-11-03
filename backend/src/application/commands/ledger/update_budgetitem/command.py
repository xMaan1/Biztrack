from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateBudgetItemCommand(ICommand):
    tenant_id: str
    budgetitem_id: str
    account_id: Optional[str] = None
    allocated_amount: Optional[float] = None
    budget_id: Optional[str] = None
    budgeted_amount: Optional[float] = None
    notes: Optional[str] = None
    remaining_amount: Optional[float] = None
    spent_amount: Optional[float] = None
