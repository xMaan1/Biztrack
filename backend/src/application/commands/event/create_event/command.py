from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateEventCommand(ICommand):
    tenant_id: str
    attachments: Optional[List[str]] = None
    createdById: str
    description: str
    discussionPoints: Optional[List[str]] = None
    endDate: datetime
    eventType: str
    googleCalendarEventId: str
    googleMeetLink: str
    isOnline: Optional[bool] = False
    location: str
    participants: Optional[List[str]] = None
    projectId: str
    recurrenceData: List[str]
    recurrenceType: str
    reminderMinutes: Optional[int] = 0
    startDate: datetime
    status: str
    timezone: Optional[str] = None
    title: str
    created_by: Optional[str] = None
