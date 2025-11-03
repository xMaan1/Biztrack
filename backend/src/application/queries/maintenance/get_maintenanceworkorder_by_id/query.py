from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetMaintenanceWorkOrderByIdQuery(IQuery):
    tenant_id: str
    maintenanceworkorder_id: str
