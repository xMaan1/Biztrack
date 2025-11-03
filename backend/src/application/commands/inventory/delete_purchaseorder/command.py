from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeletePurchaseOrderCommand(ICommand):
    tenant_id: str
    purchaseorder_id: str
