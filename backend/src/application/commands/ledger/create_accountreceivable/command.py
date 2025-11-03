from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateAccountReceivableCommand(ICommand):
    tenant_id: str
    amount_paid: Optional[float] = 0.0
    created_by: str
    currency: Optional[str] = None
    customer_email: str
    customer_id: str
    customer_name: str
    customer_phone: Optional[str] = None
    days_overdue: Optional[int] = 0
    due_date: datetime
    invoice_amount: float
    invoice_date: datetime
    invoice_id: str
    invoice_number: str
    notes: Optional[str] = None
    outstanding_balance: float
    payment_terms: Optional[str] = None
    status: str
    created_by: Optional[str] = None
