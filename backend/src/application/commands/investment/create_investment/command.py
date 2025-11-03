from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateInvestmentCommand(ICommand):
    tenant_id: str
    amount: float
    approved_by: str
    attachments: Optional[List[str]] = None
    created_by: str
    currency: Optional[str] = None
    description: str
    investment_date: datetime
    investment_number: str
    investment_type: str
    meta_data: Optional[List[str]] = None
    notes: Optional[str] = None
    reference_number: Optional[str] = None
    reference_type: Optional[str] = None
    status: str
    tags: Optional[List[str]] = None
    created_by: Optional[str] = None
