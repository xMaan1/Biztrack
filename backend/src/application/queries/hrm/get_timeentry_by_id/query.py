from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetTimeEntryByIdQuery(IQuery):
    tenant_id: str
    timeentry_id: str
