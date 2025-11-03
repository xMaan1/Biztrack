from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateStockMovementCommand(ICommand):
    tenant_id: str
    stockmovement_id: str
    batchNumber: Optional[str] = None
    createdBy: Optional[str] = None
    expiryDate: Optional[datetime] = None
    locationId: Optional[str] = None
    movementType: Optional[str] = None
    notes: Optional[str] = None
    productId: Optional[str] = None
    quantity: Optional[int] = None
    referenceNumber: Optional[str] = None
    referenceType: Optional[str] = None
    serialNumber: Optional[str] = None
    status: Optional[str] = None
    unitCost: Optional[float] = None
    warehouseId: Optional[str] = None
