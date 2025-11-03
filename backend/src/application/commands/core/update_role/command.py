from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateRoleCommand(ICommand):
    tenant_id: str
    role_id: str
    description: Optional[str] = None
    display_name: Optional[str] = None
    isActive: Optional[bool] = None
    name: Optional[str] = None
    permissions: Optional[List[str]] = None
