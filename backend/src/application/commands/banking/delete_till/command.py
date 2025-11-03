from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteTillCommand(ICommand):
    till_id: str
    tenant_id: str

