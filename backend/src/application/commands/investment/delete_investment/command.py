from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteInvestmentCommand(ICommand):
    tenant_id: str
    investment_id: str
