from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetWorkOrderTaskByIdQuery(IQuery):
    tenant_id: str
    workordertask_id: str
