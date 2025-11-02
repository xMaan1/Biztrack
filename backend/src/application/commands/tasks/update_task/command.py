from dataclasses import dataclass
from typing import Optional
from ....core.command import ICommand

@dataclass
class UpdateTaskCommand(ICommand):
    task_id: str
    tenant_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    dueDate: Optional[str] = None
    assignedToId: Optional[str] = None
    estimatedHours: Optional[float] = None
    actualHours: Optional[float] = None
    tags: Optional[list] = None

