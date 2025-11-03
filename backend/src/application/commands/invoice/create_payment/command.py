from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreatePaymentCommand(ICommand):
    tenant_id: str
    amount: float
    invoiceId: str
    notes: Optional[str] = None
    paymentDate: datetime
    paymentMethod: str
    reference: Optional[str] = None
    status: Optional[str] = None
    created_by: Optional[str] = None
