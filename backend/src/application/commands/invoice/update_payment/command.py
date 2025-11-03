from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdatePaymentCommand(ICommand):
    tenant_id: str
    payment_id: str
    amount: Optional[float] = None
    invoiceId: Optional[str] = None
    notes: Optional[str] = None
    paymentDate: Optional[datetime] = None
    paymentMethod: Optional[str] = None
    reference: Optional[str] = None
    status: Optional[str] = None
