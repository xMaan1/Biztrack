from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetProductionPlanByIdQuery(IQuery):
    tenant_id: str
    productionplan_id: str
