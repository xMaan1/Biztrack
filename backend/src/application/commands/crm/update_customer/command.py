from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from ....core.command import ICommand

@dataclass
class UpdateCustomerCommand(ICommand):
    customer_id: str
    tenant_id: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    mobile: Optional[str] = None
    cnic: Optional[str] = None
    dateOfBirth: Optional[datetime] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postalCode: Optional[str] = None
    customerType: Optional[str] = None
    customerStatus: Optional[str] = None
    creditLimit: Optional[float] = None
    currentBalance: Optional[float] = None
    paymentTerms: Optional[str] = None
    assignedToId: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

