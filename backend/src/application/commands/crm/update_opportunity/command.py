from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateOpportunityCommand(ICommand):
    tenant_id: str
    opportunity_id: str
    amount: Optional[float] = None
    assignedToId: Optional[str] = None
    companyId: Optional[str] = None
    contactId: Optional[str] = None
    description: Optional[str] = None
    expectedCloseDate: Optional[datetime] = None
    leadSource: Optional[str] = None
    name: Optional[str] = None
    notes: Optional[str] = None
    probability: Optional[int] = None
    stage: Optional[str] = None
