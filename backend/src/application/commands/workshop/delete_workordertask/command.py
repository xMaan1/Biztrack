from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteWorkOrderTaskCommand(ICommand):
    tenant_id: str
    workordertask_id: str
