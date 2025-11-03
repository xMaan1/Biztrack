from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateEventCommand(ICommand):
    tenant_id: str
    event_id: str
    attachments: Optional[List[str]] = None
    createdById: Optional[str] = None
    description: Optional[str] = None
    discussionPoints: Optional[List[str]] = None
    endDate: Optional[datetime] = None
    eventType: Optional[str] = None
    googleCalendarEventId: Optional[str] = None
    googleMeetLink: Optional[str] = None
    isOnline: Optional[bool] = None
    location: Optional[str] = None
    participants: Optional[List[str]] = None
    projectId: Optional[str] = None
    recurrenceData: Optional[List[str]] = None
    recurrenceType: Optional[str] = None
    reminderMinutes: Optional[int] = None
    startDate: Optional[datetime] = None
    status: Optional[str] = None
    timezone: Optional[str] = None
    title: Optional[str] = None
