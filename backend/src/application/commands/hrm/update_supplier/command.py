from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateSupplierCommand(ICommand):
    tenant_id: str
    supplier_id: str
    address: Optional[str] = None
    city: Optional[str] = None
    code: Optional[str] = None
    contactPerson: Optional[str] = None
    country: Optional[str] = None
    createdBy: Optional[str] = None
    creditLimit: Optional[float] = None
    email: Optional[str] = None
    isActive: Optional[bool] = None
    name: Optional[str] = None
    paymentTerms: Optional[str] = None
    phone: Optional[str] = None
    postalCode: Optional[str] = None
    state: Optional[str] = None
    website: Optional[str] = None
