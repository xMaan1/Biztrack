from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateNotificationPreferenceCommand(ICommand):
    tenant_id: str
    notificationpreference_id: str
    category: Optional[str] = None
    email_enabled: Optional[bool] = None
    in_app_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    user_id: Optional[str] = None
