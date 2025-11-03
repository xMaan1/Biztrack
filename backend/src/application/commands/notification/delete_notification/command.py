from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteNotificationCommand(ICommand):
    tenant_id: str
    notification_id: str
