from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetLeadByIdQuery(IQuery):
    tenant_id: str
    lead_id: str
