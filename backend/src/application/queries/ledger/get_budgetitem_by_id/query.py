from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetBudgetItemByIdQuery(IQuery):
    tenant_id: str
    budgetitem_id: str
