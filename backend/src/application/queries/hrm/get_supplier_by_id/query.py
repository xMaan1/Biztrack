from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetSupplierByIdQuery(IQuery):
    tenant_id: str
    supplier_id: str
