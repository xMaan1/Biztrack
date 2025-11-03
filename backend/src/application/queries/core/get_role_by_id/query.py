from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetRoleByIdQuery(IQuery):
    tenant_id: str
    role_id: str
