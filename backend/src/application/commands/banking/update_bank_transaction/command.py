from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from ....core.command import ICommand

@dataclass
class UpdateBankTransactionCommand(ICommand):
    tenant_id: str
    transaction_id: str
    bank_account_id: Optional[str] = None
    transaction_date: Optional[datetime] = None
    value_date: Optional[datetime] = None
    transaction_type: Optional[str] = None
    status: Optional[str] = None
    amount: Optional[float] = None
    running_balance: Optional[float] = None
    currency: Optional[str] = None
    exchange_rate: Optional[float] = None
    base_amount: Optional[float] = None
    payment_method: Optional[str] = None
    reference_number: Optional[str] = None
    external_reference: Optional[str] = None
    check_number: Optional[str] = None
    description: Optional[str] = None
    memo: Optional[str] = None
    category: Optional[str] = None
    counterparty_name: Optional[str] = None
    counterparty_account: Optional[str] = None
    counterparty_bank: Optional[str] = None
    related_invoice_id: Optional[str] = None
    related_purchase_order_id: Optional[str] = None
    related_expense_id: Optional[str] = None
    ledger_transaction_id: Optional[str] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[str]] = None
    notes: Optional[str] = None
    approved_by: Optional[str] = None
    is_reconciled: Optional[bool] = None
    reconciled_by: Optional[str] = None

