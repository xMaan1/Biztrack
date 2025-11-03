from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteInvoiceCommand(ICommand):
    tenant_id: str
    invoice_id: str
