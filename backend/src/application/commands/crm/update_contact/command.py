from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateContactCommand(ICommand):
    tenant_id: str
    contact_id: str
    companyId: Optional[str] = None
    contactSource: Optional[str] = None
    department: Optional[str] = None
    email: Optional[str] = None
    firstName: Optional[str] = None
    isActive: Optional[bool] = None
    jobTitle: Optional[str] = None
    lastName: Optional[str] = None
    mobile: Optional[str] = None
    notes: Optional[str] = None
    phone: Optional[str] = None
