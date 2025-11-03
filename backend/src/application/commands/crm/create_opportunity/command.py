from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateOpportunityCommand(ICommand):
    tenant_id: str
    amount: float
    assignedToId: str
    companyId: str
    contactId: str
    description: str
    expectedCloseDate: datetime
    leadSource: str
    name: str
    notes: str
    probability: Optional[int] = 0
    stage: Optional[str] = None
    created_by: Optional[str] = None
