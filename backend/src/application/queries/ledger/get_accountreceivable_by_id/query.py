from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetAccountReceivableByIdQuery(IQuery):
    tenant_id: str
    accountreceivable_id: str
