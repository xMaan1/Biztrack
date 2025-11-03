from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetPaymentByIdQuery(IQuery):
    tenant_id: str
    payment_id: str
