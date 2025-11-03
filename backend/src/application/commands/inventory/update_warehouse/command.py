from dataclasses import dataclass
from typing import Optional
from ....core.command import ICommand

@dataclass
class UpdateWarehouseCommand(ICommand):
    warehouse_id: str
    tenant_id: str
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    phone: Optional[str] = None
    isActive: Optional[bool] = None

