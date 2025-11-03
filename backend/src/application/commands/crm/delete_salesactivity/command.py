from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteSalesActivityCommand(ICommand):
    tenant_id: str
    salesactivity_id: str
