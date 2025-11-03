from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateTenantUserCommand(ICommand):
    tenant_id: str
    custom_permissions: Optional[List[str]] = None
    invitedBy: str
    isActive: Optional[bool] = False
    joinedAt: Optional[datetime] = None
    role: str
    role_id: str
    userId: str
    created_by: Optional[str] = None
