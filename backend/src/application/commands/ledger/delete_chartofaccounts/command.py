from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteChartOfAccountsCommand(ICommand):
    tenant_id: str
    chartofaccounts_id: str
