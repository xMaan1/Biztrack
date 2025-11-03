from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteWorkOrderCommand(ICommand):
    tenant_id: str
    workorder_id: str
