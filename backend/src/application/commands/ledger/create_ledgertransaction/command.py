from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateLedgerTransactionCommand(ICommand):
    tenant_id: str
    amount: float
    approved_by: str
    attachments: Optional[List[str]] = None
    created_by: str
    credit_account_id: str
    currency: Optional[str] = None
    debit_account_id: str
    description: str
    journal_entry_id: str
    notes: Optional[str] = None
    reference_id: Optional[str] = None
    reference_number: Optional[str] = None
    reference_type: Optional[str] = None
    status: str
    tags: Optional[List[str]] = None
    transaction_date: datetime
    transaction_number: str
    transaction_type: str
    created_by: Optional[str] = None
