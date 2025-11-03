from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from ....core.command import ICommand

@dataclass
class UpdateTillTransactionCommand(ICommand):
    tenant_id: str
    transaction_id: str
    till_id: Optional[str] = None
    transaction_date: Optional[datetime] = None
    transaction_type: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    reason: Optional[str] = None
    reference_number: Optional[str] = None
    bank_account_id: Optional[str] = None
    approved_by: Optional[str] = None
    notes: Optional[str] = None

