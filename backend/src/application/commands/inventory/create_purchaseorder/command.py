from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreatePurchaseOrderCommand(ICommand):
    tenant_id: str
    createdBy: str
    poNumber: str
    supplierId: str
    warehouseId: str
    orderDate: date
    batchNumber: Optional[str] = None
    expectedDeliveryDate: Optional[date] = None
    status: Optional[str] = None
    subtotal: Optional[float] = 0.0
    vatRate: Optional[float] = 0.0
    vatAmount: Optional[float] = 0.0
    totalAmount: Optional[float] = 0.0
    notes: Optional[str] = None
    items: Optional[List[str]] = None
    approvedBy: Optional[str] = None
    approvedAt: Optional[datetime] = None
    created_by: Optional[str] = None
