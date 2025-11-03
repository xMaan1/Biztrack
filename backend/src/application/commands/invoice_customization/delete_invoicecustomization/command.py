from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteInvoiceCustomizationCommand(ICommand):
    tenant_id: str
    invoicecustomization_id: str
