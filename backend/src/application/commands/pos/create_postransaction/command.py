from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreatePOSTransactionCommand(ICommand):
    tenant_id: str
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    discount: Optional[float] = 0.0
    items: List[str]
    notes: Optional[str] = None
    paymentMethod: str
    paymentStatus: Optional[str] = None
    shiftId: str
    subtotal: float
    taxAmount: Optional[float] = 0.0
    total: float
    transactionNumber: str
    created_by: Optional[str] = None
