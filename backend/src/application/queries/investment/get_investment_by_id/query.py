from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetInvestmentByIdQuery(IQuery):
    tenant_id: str
    investment_id: str
