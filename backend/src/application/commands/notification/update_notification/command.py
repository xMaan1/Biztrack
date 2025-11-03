from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateNotificationCommand(ICommand):
    tenant_id: str
    notification_id: str
    action_url: Optional[str] = None
    category: Optional[str] = None
    is_read: Optional[bool] = None
    message: Optional[str] = None
    notification_data: Optional[List[str]] = None
    read_at: Optional[datetime] = None
    title: Optional[str] = None
    type: Optional[str] = None
    user_id: Optional[str] = None
