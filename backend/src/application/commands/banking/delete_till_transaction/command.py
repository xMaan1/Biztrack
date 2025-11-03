from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteTillTransactionCommand(ICommand):
    tenant_id: str
    transaction_id: str

