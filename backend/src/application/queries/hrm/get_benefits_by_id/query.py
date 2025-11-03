from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetBenefitsByIdQuery(IQuery):
    tenant_id: str
    benefits_id: str
