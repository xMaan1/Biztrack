from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetWorkOrderByIdQuery(IQuery):
    tenant_id: str
    workorder_id: str
