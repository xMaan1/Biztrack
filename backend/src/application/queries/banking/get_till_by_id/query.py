from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetTillByIdQuery(IQuery):
    tenant_id: str
    till_id: str

