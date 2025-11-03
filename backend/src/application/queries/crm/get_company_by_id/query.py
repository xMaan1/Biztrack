from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetCompanyByIdQuery(IQuery):
    tenant_id: str
    company_id: str
