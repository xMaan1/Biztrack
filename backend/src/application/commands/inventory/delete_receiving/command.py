from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteReceivingCommand(ICommand):
    tenant_id: str
    receiving_id: str
