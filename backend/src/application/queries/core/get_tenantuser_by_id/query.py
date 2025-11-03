from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetTenantUserByIdQuery(IQuery):
    tenant_id: str
    tenantuser_id: str
