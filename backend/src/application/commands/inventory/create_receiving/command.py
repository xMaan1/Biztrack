from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateReceivingCommand(ICommand):
    tenant_id: str
    items: Optional[List[str]] = None
    notes: str
    purchaseOrderId: str
    receivedBy: str
    receivedDate: datetime
    receivingNumber: str
    status: Optional[str] = None
    warehouseId: str
    created_by: Optional[str] = None
