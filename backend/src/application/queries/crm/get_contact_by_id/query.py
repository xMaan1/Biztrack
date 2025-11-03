from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetContactByIdQuery(IQuery):
    tenant_id: str
    contact_id: str
