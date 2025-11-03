from dataclasses import dataclass
from typing import Optional
from ....core.command import ICommand

@dataclass
class UpdateTillCommand(ICommand):
    till_id: str
    tenant_id: str
    name: Optional[str] = None
    location: Optional[str] = None
    initial_balance: Optional[float] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None

