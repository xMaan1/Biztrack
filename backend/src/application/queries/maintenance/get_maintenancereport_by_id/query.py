from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetMaintenanceReportByIdQuery(IQuery):
    tenant_id: str
    maintenancereport_id: str
