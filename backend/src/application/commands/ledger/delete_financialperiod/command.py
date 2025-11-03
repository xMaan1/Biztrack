from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteFinancialPeriodCommand(ICommand):
    tenant_id: str
    financialperiod_id: str
