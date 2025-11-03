from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from ....core.command import ICommand

@dataclass
class CreateJobPostingCommand(ICommand):
    tenant_id: str
    title: str
    department: str
    description: str
    requirements: List[str] = None
    responsibilities: List[str] = None
    location: str = None
    type: str = None
    salaryRange: Optional[str] = None
    benefits: List[str] = None
    status: str = "open"
    openDate: str = None
    closeDate: Optional[str] = None
    hiringManagerId: Optional[str] = None
    tags: List[str] = None
    created_by: str = None

