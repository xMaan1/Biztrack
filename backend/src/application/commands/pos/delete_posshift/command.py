from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeletePOSShiftCommand(ICommand):
    tenant_id: str
    posshift_id: str
