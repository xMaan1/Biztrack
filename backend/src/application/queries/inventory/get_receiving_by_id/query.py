from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetReceivingByIdQuery(IQuery):
    tenant_id: str
    receiving_id: str
