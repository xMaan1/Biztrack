from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateRoleCommand(ICommand):
    tenant_id: str
    description: str
    display_name: str
    isActive: Optional[bool] = False
    name: str
    permissions: Optional[List[str]] = None
    created_by: Optional[str] = None
