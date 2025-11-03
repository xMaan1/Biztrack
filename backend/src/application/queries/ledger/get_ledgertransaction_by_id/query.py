from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetLedgerTransactionByIdQuery(IQuery):
    tenant_id: str
    ledgertransaction_id: str
