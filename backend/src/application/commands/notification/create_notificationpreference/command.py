from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateNotificationPreferenceCommand(ICommand):
    tenant_id: str
    category: str
    email_enabled: Optional[bool] = False
    in_app_enabled: Optional[bool] = False
    push_enabled: Optional[bool] = False
    user_id: str
    created_by: Optional[str] = None
