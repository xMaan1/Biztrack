from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateJournalEntryCommand(ICommand):
    tenant_id: str
    attachments: Optional[List[str]] = None
    created_by: str
    description: str
    entry_date: datetime
    entry_number: str
    is_posted: Optional[bool] = False
    notes: Optional[str] = None
    posted_at: Optional[datetime] = None
    posted_by: str
    reference_number: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    created_by: Optional[str] = None
