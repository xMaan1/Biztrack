from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateJobPostingCommand(ICommand):
    job_id: str
    tenant_id: str
    title: Optional[str] = None
    department: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    location: Optional[str] = None
    type: Optional[str] = None
    salaryRange: Optional[str] = None
    benefits: Optional[List[str]] = None
    status: Optional[str] = None
    openDate: Optional[str] = None
    closeDate: Optional[str] = None
    hiringManagerId: Optional[str] = None
    tags: Optional[List[str]] = None

