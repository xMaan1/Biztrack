from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteStockMovementCommand(ICommand):
    tenant_id: str
    stockmovement_id: str
