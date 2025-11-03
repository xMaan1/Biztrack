from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteMaintenanceWorkOrderCommand(ICommand):
    tenant_id: str
    maintenanceworkorder_id: str
