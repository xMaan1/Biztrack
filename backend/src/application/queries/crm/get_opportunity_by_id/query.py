from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetOpportunityByIdQuery(IQuery):
    tenant_id: str
    opportunity_id: str
