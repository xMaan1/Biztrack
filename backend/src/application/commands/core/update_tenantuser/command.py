from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateTenantUserCommand(ICommand):
    tenant_id: str
    tenantuser_id: str
    custom_permissions: Optional[List[str]] = None
    invitedBy: Optional[str] = None
    isActive: Optional[bool] = None
    joinedAt: Optional[datetime] = None
    role: Optional[str] = None
    role_id: Optional[str] = None
    userId: Optional[str] = None
