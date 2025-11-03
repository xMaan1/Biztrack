from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateContactCommand(ICommand):
    tenant_id: str
    companyId: str
    contactSource: str
    department: str
    email: str
    firstName: str
    isActive: Optional[bool] = False
    jobTitle: str
    lastName: str
    mobile: str
    notes: str
    phone: str
    created_by: Optional[str] = None
