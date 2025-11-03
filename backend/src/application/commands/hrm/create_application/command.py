from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateApplicationCommand(ICommand):
    tenant_id: str
    assignedTo: str
    coverLetter: Optional[str] = None
    createdBy: str
    education: Optional[str] = None
    email: str
    experience: Optional[str] = None
    firstName: str
    interviewDate: Optional[datetime] = None
    interviewNotes: Optional[str] = None
    jobPostingId: str
    lastName: str
    notes: Optional[str] = None
    phone: Optional[str] = None
    resume: Optional[str] = None
    skills: Optional[List[str]] = None
    status: Optional[str] = None
    created_by: Optional[str] = None
