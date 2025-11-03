from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetProductionScheduleByIdQuery(IQuery):
    tenant_id: str
    productionschedule_id: str
