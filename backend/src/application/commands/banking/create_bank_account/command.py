from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateBankAccountCommand(ICommand):
    tenant_id: str
    account_name: str
    account_number: str
    routing_number: Optional[str] = None
    bank_name: str = None
    bank_code: Optional[str] = None
    account_type: str = "checking"
    currency: str = "USD"
    current_balance: float = 0.0
    available_balance: float = 0.0
    pending_balance: float = 0.0
    is_active: bool = True
    is_primary: bool = False
    supports_online_banking: bool = False
    description: Optional[str] = None
    tags: List[str] = None
    created_by: str = None

