from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteApplicationCommand(ICommand):
    tenant_id: str
    application_id: str
