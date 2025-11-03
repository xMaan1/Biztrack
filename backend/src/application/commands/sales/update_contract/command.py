from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateContractCommand(ICommand):
    tenant_id: str
    contract_id: str
    activatedAt: Optional[datetime] = None
    autoRenew: Optional[bool] = None
    contractNumber: Optional[str] = None
    createdBy: Optional[str] = None
    description: Optional[str] = None
    endDate: Optional[datetime] = None
    notes: Optional[str] = None
    opportunityId: Optional[str] = None
    renewalTerms: Optional[str] = None
    signedAt: Optional[datetime] = None
    startDate: Optional[datetime] = None
    status: Optional[str] = None
    terms: Optional[str] = None
    title: Optional[str] = None
    value: Optional[float] = None
