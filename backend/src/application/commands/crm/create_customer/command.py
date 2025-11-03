from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from ....core.command import ICommand

@dataclass
class CreateCustomerCommand(ICommand):
    tenant_id: str
    firstName: str
    lastName: str
    email: str
    phone: Optional[str] = None
    mobile: Optional[str] = None
    cnic: Optional[str] = None
    dateOfBirth: Optional[datetime] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: str = "Pakistan"
    postalCode: Optional[str] = None
    customerType: str = "individual"
    customerStatus: str = "active"
    creditLimit: float = 0.0
    currentBalance: float = 0.0
    paymentTerms: str = "Cash"
    assignedToId: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = None

