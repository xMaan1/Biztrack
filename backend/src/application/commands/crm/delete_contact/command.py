from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteContactCommand(ICommand):
    tenant_id: str
    contact_id: str
