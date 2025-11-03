from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateInvestmentTransactionCommand(ICommand):
    tenant_id: str
    amount: float
    created_by: str
    credit_account_id: str
    currency: Optional[str] = None
    debit_account_id: str
    description: str
    investment_id: str
    reference_number: Optional[str] = None
    status: Optional[str] = None
    transaction_date: datetime
    transaction_type: str
    created_by: Optional[str] = None
