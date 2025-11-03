from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetPOSTransactionByIdQuery(IQuery):
    tenant_id: str
    postransaction_id: str
