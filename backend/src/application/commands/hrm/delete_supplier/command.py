from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteSupplierCommand(ICommand):
    tenant_id: str
    supplier_id: str
