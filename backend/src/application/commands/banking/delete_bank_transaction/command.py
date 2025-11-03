from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteBankTransactionCommand(ICommand):
    tenant_id: str
    transaction_id: str

