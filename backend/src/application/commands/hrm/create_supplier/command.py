from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateSupplierCommand(ICommand):
    tenant_id: str
    address: str
    city: str
    code: str
    contactPerson: str
    country: str
    createdBy: str
    creditLimit: Optional[float] = None
    email: str
    isActive: Optional[bool] = False
    name: str
    paymentTerms: str
    phone: str
    postalCode: str
    state: str
    website: str
    created_by: Optional[str] = None
