from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetInvoiceCustomizationByIdQuery(IQuery):
    tenant_id: str
    invoicecustomization_id: str
