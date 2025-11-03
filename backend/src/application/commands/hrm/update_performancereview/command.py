from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime, date
from ....core.command import ICommand

@dataclass
class UpdatePerformanceReviewCommand(ICommand):
    tenant_id: str
    performancereview_id: str
    areasForImprovement: Optional[str] = None
    comments: Optional[str] = None
    communicationRating: Optional[int] = None
    createdBy: Optional[str] = None
    employeeId: Optional[str] = None
    goals: Optional[str] = None
    isCompleted: Optional[bool] = None
    leadershipRating: Optional[int] = None
    nextReviewDate: Optional[datetime] = None
    rating: Optional[int] = None
    reviewDate: Optional[datetime] = None
    reviewPeriod: Optional[str] = None
    reviewType: Optional[str] = None
    reviewerId: Optional[str] = None
    strengths: Optional[str] = None
    teamworkRating: Optional[int] = None
    technicalRating: Optional[int] = None
