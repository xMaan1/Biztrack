from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetContractByIdQuery(IQuery):
    tenant_id: str
    contract_id: str
