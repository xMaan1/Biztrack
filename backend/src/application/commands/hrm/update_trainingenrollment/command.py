from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateTrainingEnrollmentCommand(ICommand):
    tenant_id: str
    trainingenrollment_id: str
    certificate: Optional[str] = None
    completionDate: Optional[datetime] = None
    createdBy: Optional[str] = None
    employeeId: Optional[str] = None
    enrollmentDate: Optional[datetime] = None
    feedback: Optional[str] = None
    score: Optional[int] = None
    status: Optional[str] = None
    trainingId: Optional[str] = None
