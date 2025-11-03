from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreateTrainingCommand(ICommand):
    tenant_id: str
    cost: Optional[float] = 0.0
    createdBy: str
    description: str
    duration: str
    endDate: datetime
    materials: Optional[List[str]] = None
    maxParticipants: Optional[int] = None
    objectives: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    provider: str
    startDate: datetime
    status: Optional[str] = None
    title: str
    trainingType: Optional[str] = None
    created_by: Optional[str] = None
