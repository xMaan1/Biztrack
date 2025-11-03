from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteCustomerCommand(ICommand):
    customer_id: str
    tenant_id: str

