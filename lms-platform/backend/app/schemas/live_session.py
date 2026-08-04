from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class LiveSessionCreate(BaseModel):
    course_id: int
    lecture_id: Optional[int] = None
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    participant_ids: Optional[List[int]] = None
    invite_teachers: Optional[List[int]] = None
    invite_admins: Optional[List[int]] = None


class LiveSessionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    participant_ids: Optional[List[int]] = None
    invite_teachers: Optional[List[int]] = None
    invite_admins: Optional[List[int]] = None


class LiveSessionResponse(BaseModel):
    id: int
    course_id: int
    lecture_id: Optional[int] = None
    teacher_id: int
    title: str
    description: Optional[str] = None
    session_code: str
    status: str
    participant_ids: Optional[list] = None
    invite_teachers: Optional[list] = None
    invite_admins: Optional[list] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
