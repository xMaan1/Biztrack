from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteUserCommand(ICommand):
    user_id: str

