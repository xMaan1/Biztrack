from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetStockMovementByIdQuery(IQuery):
    tenant_id: str
    stockmovement_id: str
