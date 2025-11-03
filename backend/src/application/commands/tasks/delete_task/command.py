from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteTaskCommand(ICommand):
    task_id: str
    tenant_id: str

