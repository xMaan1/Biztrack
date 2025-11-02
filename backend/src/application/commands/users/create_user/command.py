from dataclasses import dataclass
from typing import Optional
from ....core.command import ICommand

@dataclass
class CreateUserCommand(ICommand):
    userName: str
    email: str
    password: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    userRole: str = "team_member"
    avatar: Optional[str] = None
    tenant_id: Optional[str] = None

