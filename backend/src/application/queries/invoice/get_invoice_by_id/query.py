from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetInvoiceByIdQuery(IQuery):
    tenant_id: str
    invoice_id: str
