from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteContractCommand(ICommand):
    tenant_id: str
    contract_id: str
