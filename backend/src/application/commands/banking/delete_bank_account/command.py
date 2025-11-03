from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteBankAccountCommand(ICommand):
    account_id: str
    tenant_id: str

