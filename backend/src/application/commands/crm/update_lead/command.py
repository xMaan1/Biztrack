from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateLeadCommand(ICommand):
    tenant_id: str
    lead_id: str
    assignedToId: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    firstName: Optional[str] = None
    jobTitle: Optional[str] = None
    lastName: Optional[str] = None
    leadSource: Optional[str] = None
    notes: Optional[str] = None
    phone: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
