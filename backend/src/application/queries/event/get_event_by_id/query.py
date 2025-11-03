from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetEventByIdQuery(IQuery):
    tenant_id: str
    event_id: str
