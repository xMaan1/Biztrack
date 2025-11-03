from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteBudgetItemCommand(ICommand):
    tenant_id: str
    budgetitem_id: str
