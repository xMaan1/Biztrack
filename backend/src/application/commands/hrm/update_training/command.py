from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdateTrainingCommand(ICommand):
    tenant_id: str
    training_id: str
    cost: Optional[float] = None
    createdBy: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    endDate: Optional[datetime] = None
    materials: Optional[List[str]] = None
    maxParticipants: Optional[int] = None
    objectives: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    provider: Optional[str] = None
    startDate: Optional[datetime] = None
    status: Optional[str] = None
    title: Optional[str] = None
    trainingType: Optional[str] = None
