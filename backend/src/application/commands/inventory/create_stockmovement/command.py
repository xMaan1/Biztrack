from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateStockMovementCommand(ICommand):
    tenant_id: str
    batchNumber: Optional[str] = None
    createdBy: str
    expiryDate: Optional[datetime] = None
    locationId: Optional[str] = None
    movementType: str
    notes: Optional[str] = None
    productId: str
    quantity: int
    referenceNumber: Optional[str] = None
    referenceType: Optional[str] = None
    serialNumber: Optional[str] = None
    status: Optional[str] = None
    unitCost: float
    warehouseId: str
    created_by: Optional[str] = None
