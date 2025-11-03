from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateInvestmentCommand(ICommand):
    tenant_id: str
    investment_id: str
    amount: Optional[float] = None
    approved_by: Optional[str] = None
    attachments: Optional[List[str]] = None
    created_by: Optional[str] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    investment_date: Optional[datetime] = None
    investment_number: Optional[str] = None
    investment_type: Optional[str] = None
    meta_data: Optional[List[str]] = None
    notes: Optional[str] = None
    reference_number: Optional[str] = None
    reference_type: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
