from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetMaintenanceScheduleByIdQuery(IQuery):
    tenant_id: str
    maintenanceschedule_id: str
