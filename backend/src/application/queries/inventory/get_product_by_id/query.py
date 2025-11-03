from dataclasses import dataclass
from typing import Optional
from ....core.query import IQuery

@dataclass
class GetProductByIdQuery(IQuery):
    product_id: str
    tenant_id: Optional[str] = None

