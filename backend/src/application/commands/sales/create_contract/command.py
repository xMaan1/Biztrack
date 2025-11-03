from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateContractCommand(ICommand):
    tenant_id: str
    activatedAt: Optional[datetime] = None
    autoRenew: Optional[bool] = False
    contractNumber: str
    createdBy: str
    description: Optional[str] = None
    endDate: datetime
    notes: Optional[str] = None
    opportunityId: Optional[str] = None
    renewalTerms: Optional[str] = None
    signedAt: Optional[datetime] = None
    startDate: datetime
    status: Optional[str] = None
    terms: Optional[str] = None
    title: str
    value: float
    created_by: Optional[str] = None
