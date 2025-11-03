from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateSalesActivityCommand(ICommand):
    tenant_id: str
    salesactivity_id: str
    assignedToId: Optional[str] = None
    completedAt: Optional[datetime] = None
    description: Optional[str] = None
    dueDate: Optional[datetime] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    relatedToId: Optional[str] = None
    relatedToType: Optional[str] = None
    status: Optional[str] = None
    subject: Optional[str] = None
    type: Optional[str] = None
