from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetApplicationByIdQuery(IQuery):
    tenant_id: str
    application_id: str
