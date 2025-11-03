from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetInvestmentTransactionByIdQuery(IQuery):
    tenant_id: str
    investmenttransaction_id: str
