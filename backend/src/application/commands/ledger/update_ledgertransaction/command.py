from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateLedgerTransactionCommand(ICommand):
    tenant_id: str
    ledgertransaction_id: str
    amount: Optional[float] = None
    approved_by: Optional[str] = None
    attachments: Optional[List[str]] = None
    created_by: Optional[str] = None
    credit_account_id: Optional[str] = None
    currency: Optional[str] = None
    debit_account_id: Optional[str] = None
    description: Optional[str] = None
    journal_entry_id: Optional[str] = None
    notes: Optional[str] = None
    reference_id: Optional[str] = None
    reference_number: Optional[str] = None
    reference_type: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    transaction_date: Optional[datetime] = None
    transaction_number: Optional[str] = None
    transaction_type: Optional[str] = None
