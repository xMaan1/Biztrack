from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteTenantUserCommand(ICommand):
    tenant_id: str
    tenantuser_id: str
