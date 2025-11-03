from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateProjectCommand(ICommand):
    tenant_id: str
    name: str
    description: Optional[str] = None
    status: str = "planning"
    priority: str = "medium"
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    completionPercent: int = 0
    budget: Optional[float] = None
    actualCost: float = 0.0
    notes: Optional[str] = None
    clientEmail: Optional[str] = None
    projectManagerId: str = None
    teamMemberIds: List[str] = None

