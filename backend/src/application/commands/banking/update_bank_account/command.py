from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateBankAccountCommand(ICommand):
    account_id: str
    tenant_id: str
    account_name: Optional[str] = None
    routing_number: Optional[str] = None
    bank_name: Optional[str] = None
    bank_code: Optional[str] = None
    account_type: Optional[str] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None
    is_primary: Optional[bool] = None
    supports_online_banking: Optional[bool] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None

