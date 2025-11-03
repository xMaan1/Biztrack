from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdatePOSTransactionCommand(ICommand):
    tenant_id: str
    postransaction_id: str
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    discount: Optional[float] = None
    items: Optional[List[str]] = None
    notes: Optional[str] = None
    paymentMethod: Optional[str] = None
    paymentStatus: Optional[str] = None
    shiftId: Optional[str] = None
    subtotal: Optional[float] = None
    taxAmount: Optional[float] = None
    total: Optional[float] = None
    transactionNumber: Optional[str] = None
