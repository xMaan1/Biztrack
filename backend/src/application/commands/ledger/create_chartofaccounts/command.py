from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateChartOfAccountsCommand(ICommand):
    tenant_id: str
    account_category: str
    account_code: str
    account_name: str
    account_type: str
    created_by: str
    currency: Optional[str] = None
    current_balance: Optional[float] = 0.0
    description: Optional[str] = None
    is_active: Optional[bool] = False
    is_system_account: Optional[bool] = False
    opening_balance: Optional[float] = 0.0
    parent_account_id: str
    created_by: Optional[str] = None
