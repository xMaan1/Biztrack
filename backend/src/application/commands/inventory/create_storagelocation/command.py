from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateStorageLocationCommand(ICommand):
    tenant_id: str
    capacity: Optional[float] = None
    code: str
    createdBy: str
    description: Optional[str] = None
    isActive: Optional[bool] = False
    locationType: str
    name: str
    parentLocationId: str
    usedCapacity: Optional[float] = None
    warehouseId: str
    created_by: Optional[str] = None
