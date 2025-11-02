from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetCustomerByIdQuery(IQuery):
    customer_id: str
    tenant_id: str

