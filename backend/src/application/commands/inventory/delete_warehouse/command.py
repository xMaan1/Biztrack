from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteWarehouseCommand(ICommand):
    warehouse_id: str
    tenant_id: str

