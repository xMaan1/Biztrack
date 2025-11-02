from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteProductCommand(ICommand):
    product_id: str
    tenant_id: str

