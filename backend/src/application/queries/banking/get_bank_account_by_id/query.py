from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetBankAccountByIdQuery(IQuery):
    account_id: str
    tenant_id: str

