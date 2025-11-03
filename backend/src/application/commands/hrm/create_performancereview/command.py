from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class CreatePerformanceReviewCommand(ICommand):
    tenant_id: str
    areasForImprovement: str
    comments: str
    communicationRating: Optional[int] = 0
    createdBy: str
    employeeId: str
    goals: str
    isCompleted: Optional[bool] = False
    leadershipRating: Optional[int] = 0
    nextReviewDate: datetime
    rating: int
    reviewDate: datetime
    reviewPeriod: str
    reviewType: Optional[str] = None
    reviewerId: str
    strengths: str
    teamworkRating: Optional[int] = 0
    technicalRating: Optional[int] = 0
    created_by: Optional[str] = None
