from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteLeaveRequestCommand(ICommand):
    tenant_id: str
    leaverequest_id: str
