from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetProductionStepByIdQuery(IQuery):
    tenant_id: str
    productionstep_id: str
