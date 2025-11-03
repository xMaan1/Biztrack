from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateInvestmentTransactionCommand(ICommand):
    tenant_id: str
    investmenttransaction_id: str
    amount: Optional[float] = None
    created_by: Optional[str] = None
    credit_account_id: Optional[str] = None
    currency: Optional[str] = None
    debit_account_id: Optional[str] = None
    description: Optional[str] = None
    investment_id: Optional[str] = None
    reference_number: Optional[str] = None
    status: Optional[str] = None
    transaction_date: Optional[datetime] = None
    transaction_type: Optional[str] = None
