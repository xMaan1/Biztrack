from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteMaintenanceReportCommand(ICommand):
    tenant_id: str
    maintenancereport_id: str
