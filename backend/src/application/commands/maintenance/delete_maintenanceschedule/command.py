from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteMaintenanceScheduleCommand(ICommand):
    tenant_id: str
    maintenanceschedule_id: str
