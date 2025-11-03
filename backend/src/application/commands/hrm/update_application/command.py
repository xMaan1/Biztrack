from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateApplicationCommand(ICommand):
    tenant_id: str
    application_id: str
    assignedTo: Optional[str] = None
    coverLetter: Optional[str] = None
    createdBy: Optional[str] = None
    education: Optional[str] = None
    email: Optional[str] = None
    experience: Optional[str] = None
    firstName: Optional[str] = None
    interviewDate: Optional[datetime] = None
    interviewNotes: Optional[str] = None
    jobPostingId: Optional[str] = None
    lastName: Optional[str] = None
    notes: Optional[str] = None
    phone: Optional[str] = None
    resume: Optional[str] = None
    skills: Optional[List[str]] = None
    status: Optional[str] = None
