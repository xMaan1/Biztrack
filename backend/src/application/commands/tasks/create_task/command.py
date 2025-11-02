from dataclasses import dataclass
from typing import Optional
from ....core.command import ICommand

@dataclass
class CreateTaskCommand(ICommand):
    tenant_id: str
    projectId: str
    title: str
    description: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    dueDate: Optional[str] = None
    assignedToId: Optional[str] = None
    createdById: str = None
    parentTaskId: Optional[str] = None
    estimatedHours: Optional[float] = None
    tags: list = None

