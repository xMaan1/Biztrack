from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetPurchaseOrderByIdQuery(IQuery):
    tenant_id: str
    purchaseorder_id: str
