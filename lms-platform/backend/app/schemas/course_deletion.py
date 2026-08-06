from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime

class CourseDeletionRequestCreate(BaseModel):
    reason: Optional[str] = None

class CourseDeletionRequestReview(BaseModel):
    admin_remarks: Optional[str] = None

class CourseDeletionRequestResponse(BaseModel):
    id: int
    course_id: int
    course_title: Optional[str] = None
    requested_by: int
    requester_name: Optional[str] = None
    status: str
    reason: Optional[str] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    admin_remarks: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
