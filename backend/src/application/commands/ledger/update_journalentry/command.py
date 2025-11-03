from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateJournalEntryCommand(ICommand):
    tenant_id: str
    journalentry_id: str
    attachments: Optional[List[str]] = None
    created_by: Optional[str] = None
    description: Optional[str] = None
    entry_date: Optional[datetime] = None
    entry_number: Optional[str] = None
    is_posted: Optional[bool] = None
    notes: Optional[str] = None
    posted_at: Optional[datetime] = None
    posted_by: Optional[str] = None
    reference_number: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
