from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateTrainingEnrollmentCommand(ICommand):
    tenant_id: str
    certificate: Optional[str] = None
    completionDate: Optional[datetime] = None
    createdBy: str
    employeeId: str
    enrollmentDate: datetime
    feedback: Optional[str] = None
    score: Optional[int] = None
    status: Optional[str] = None
    trainingId: str
    created_by: Optional[str] = None
