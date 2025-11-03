from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateReceivingCommand(ICommand):
    tenant_id: str
    receiving_id: str
    items: Optional[List[str]] = None
    notes: Optional[str] = None
    purchaseOrderId: Optional[str] = None
    receivedBy: Optional[str] = None
    receivedDate: Optional[datetime] = None
    receivingNumber: Optional[str] = None
    status: Optional[str] = None
    warehouseId: Optional[str] = None
