from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeletePaymentCommand(ICommand):
    tenant_id: str
    payment_id: str
