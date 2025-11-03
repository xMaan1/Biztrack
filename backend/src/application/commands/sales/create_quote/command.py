from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateQuoteCommand(ICommand):
    tenant_id: str
    acceptedAt: Optional[datetime] = None
    createdBy: str
    description: Optional[str] = None
    notes: Optional[str] = None
    opportunityId: Optional[str] = None
    quoteNumber: str
    sentAt: Optional[datetime] = None
    status: Optional[str] = None
    subtotal: Optional[float] = 0.0
    taxAmount: Optional[float] = 0.0
    taxRate: Optional[float] = 0.0
    terms: Optional[str] = None
    title: str
    total: Optional[float] = 0.0
    validUntil: datetime
    viewedAt: Optional[datetime] = None
    created_by: Optional[str] = None
