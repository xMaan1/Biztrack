from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from ....core.command import ICommand

@dataclass
class CreateTillTransactionCommand(ICommand):
    tenant_id: str
    till_id: str
    transaction_number: str
    transaction_date: datetime
    transaction_type: str
    amount: float
    description: str
    bank_account_id: Optional[str] = None
    currency: str = "USD"
    reason: Optional[str] = None
    reference_number: Optional[str] = None
    performed_by: str = None
    approved_by: Optional[str] = None
    notes: Optional[str] = None

