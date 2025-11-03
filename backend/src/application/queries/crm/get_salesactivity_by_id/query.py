from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetSalesActivityByIdQuery(IQuery):
    tenant_id: str
    salesactivity_id: str
