from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateAccountReceivableCommand(ICommand):
    tenant_id: str
    accountreceivable_id: str
    amount_paid: Optional[float] = None
    created_by: Optional[str] = None
    currency: Optional[str] = None
    customer_email: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    days_overdue: Optional[int] = None
    due_date: Optional[datetime] = None
    invoice_amount: Optional[float] = None
    invoice_date: Optional[datetime] = None
    invoice_id: Optional[str] = None
    invoice_number: Optional[str] = None
    notes: Optional[str] = None
    outstanding_balance: Optional[float] = None
    payment_terms: Optional[str] = None
    status: Optional[str] = None
