from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeletePOSTransactionCommand(ICommand):
    tenant_id: str
    postransaction_id: str
