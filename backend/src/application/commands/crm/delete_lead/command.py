from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteLeadCommand(ICommand):
    tenant_id: str
    lead_id: str
