from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetBudgetByIdQuery(IQuery):
    tenant_id: str
    budget_id: str
