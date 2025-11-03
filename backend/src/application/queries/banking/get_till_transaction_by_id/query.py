from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetTillTransactionByIdQuery(IQuery):
    tenant_id: str
    transaction_id: str

