from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateNotificationCommand(ICommand):
    tenant_id: str
    action_url: Optional[str] = None
    category: str
    is_read: Optional[bool] = False
    message: str
    notification_data: Optional[List[str]] = None
    read_at: Optional[datetime] = None
    title: str
    type: str
    user_id: str
    created_by: Optional[str] = None
