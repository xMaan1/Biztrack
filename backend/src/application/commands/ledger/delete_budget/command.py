from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteBudgetCommand(ICommand):
    tenant_id: str
    budget_id: str
