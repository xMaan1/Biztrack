from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from ....core.command import ICommand

@dataclass
class CreateBankTransactionCommand(ICommand):
    tenant_id: str
    bank_account_id: str
    transaction_number: str
    transaction_date: datetime
    transaction_type: str
    amount: float
    running_balance: float
    base_amount: float
    description: str
    value_date: Optional[datetime] = None
    status: str = "pending"
    currency: str = "USD"
    exchange_rate: float = 1.0
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    external_reference: Optional[str] = None
    check_number: Optional[str] = None
    memo: Optional[str] = None
    category: Optional[str] = None
    counterparty_name: Optional[str] = None
    counterparty_account: Optional[str] = None
    counterparty_bank: Optional[str] = None
    related_invoice_id: Optional[str] = None
    related_purchase_order_id: Optional[str] = None
    related_expense_id: Optional[str] = None
    ledger_transaction_id: Optional[str] = None
    tags: List[str] = None
    attachments: List[str] = None
    notes: Optional[str] = None
    created_by: str = None
    approved_by: Optional[str] = None

