from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateStorageLocationCommand(ICommand):
    tenant_id: str
    storagelocation_id: str
    capacity: Optional[float] = None
    code: Optional[str] = None
    createdBy: Optional[str] = None
    description: Optional[str] = None
    isActive: Optional[bool] = None
    locationType: Optional[str] = None
    name: Optional[str] = None
    parentLocationId: Optional[str] = None
    usedCapacity: Optional[float] = None
    warehouseId: Optional[str] = None
