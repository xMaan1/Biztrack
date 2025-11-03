from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateLeadCommand(ICommand):
    tenant_id: str
    firstName: str
    lastName: str
    email: str
    assignedToId: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    leadSource: Optional[str] = None
    notes: Optional[str] = None
    phone: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    created_by: Optional[str] = None
