from dataclasses import dataclass
from typing import Optional
from ....core.command import ICommand

@dataclass
class CreateTillCommand(ICommand):
    tenant_id: str
    name: str
    location: Optional[str] = None
    initial_balance: float = 0.0
    current_balance: float = 0.0
    currency: str = "USD"
    is_active: bool = True
    description: Optional[str] = None
    created_by: str = None

