from dataclasses import dataclass
from typing import Optional
from ....core.query import IQuery

@dataclass
class GetWarehouseByIdQuery(IQuery):
    warehouse_id: str
    tenant_id: Optional[str] = None

