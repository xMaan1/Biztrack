from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateQuoteCommand(ICommand):
    tenant_id: str
    quote_id: str
    acceptedAt: Optional[datetime] = None
    createdBy: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    opportunityId: Optional[str] = None
    quoteNumber: Optional[str] = None
    sentAt: Optional[datetime] = None
    status: Optional[str] = None
    subtotal: Optional[float] = None
    taxAmount: Optional[float] = None
    taxRate: Optional[float] = None
    terms: Optional[str] = None
    title: Optional[str] = None
    total: Optional[float] = None
    validUntil: Optional[datetime] = None
    viewedAt: Optional[datetime] = None
