from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdatePurchaseOrderCommand(ICommand):
    tenant_id: str
    purchaseorder_id: str
    approvedAt: Optional[datetime] = None
    approvedBy: Optional[str] = None
    batchNumber: Optional[str] = None
    createdBy: Optional[str] = None
    expectedDeliveryDate: Optional[date] = None
    items: Optional[List[str]] = None
    notes: Optional[str] = None
    orderDate: Optional[date] = None
    poNumber: Optional[str] = None
    status: Optional[str] = None
    subtotal: Optional[float] = None
    supplierId: Optional[str] = None
    totalAmount: Optional[float] = None
    vatAmount: Optional[float] = None
    vatRate: Optional[float] = None
    warehouseId: Optional[str] = None
