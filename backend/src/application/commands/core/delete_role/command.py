from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteRoleCommand(ICommand):
    tenant_id: str
    role_id: str
