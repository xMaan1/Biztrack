from dataclasses import dataclass
from typing import Optional
from ....core.command import ICommand

@dataclass
class CreateWarehouseCommand(ICommand):
    tenant_id: str
    name: str
    code: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    phone: Optional[str] = None
    isActive: bool = True
    created_by: str = None

