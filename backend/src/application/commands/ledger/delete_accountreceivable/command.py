from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteAccountReceivableCommand(ICommand):
    tenant_id: str
    accountreceivable_id: str
