from dataclasses import dataclass
from typing import Optional
from ....core.command import ICommand

@dataclass
class UpdateUserCommand(ICommand):
    user_id: str
    userName: Optional[str] = None
    email: Optional[str] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    userRole: Optional[str] = None
    avatar: Optional[str] = None
    password: Optional[str] = None

