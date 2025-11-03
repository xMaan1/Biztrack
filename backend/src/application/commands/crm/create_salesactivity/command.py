from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateSalesActivityCommand(ICommand):
    tenant_id: str
    assignedToId: str
    completedAt: datetime
    description: str
    dueDate: datetime
    notes: str
    priority: Optional[str] = None
    relatedToId: str
    relatedToType: str
    status: Optional[str] = None
    subject: str
    type: str
    created_by: Optional[str] = None
