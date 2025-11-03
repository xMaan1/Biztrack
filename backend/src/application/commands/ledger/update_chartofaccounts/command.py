from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateChartOfAccountsCommand(ICommand):
    tenant_id: str
    chartofaccounts_id: str
    account_category: Optional[str] = None
    account_code: Optional[str] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    created_by: Optional[str] = None
    currency: Optional[str] = None
    current_balance: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    is_system_account: Optional[bool] = None
    opening_balance: Optional[float] = None
    parent_account_id: Optional[str] = None
