from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteTimeEntryCommand(ICommand):
    tenant_id: str
    timeentry_id: str
