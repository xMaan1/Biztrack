"""
Submission Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class SubmissionBase(BaseModel):
    """Base submission schema"""
    assignment_id: int = Field(..., description="Assignment ID")
    student_id: int = Field(..., description="Student ID")
    file_name: str = Field(..., max_length=255)
    file_path: str = Field(..., max_length=500)
    file_size: int = Field(..., ge=0, description="File size in bytes")
    mime_type: str = Field(..., max_length=100)
    submission_text: Optional[str] = Field(default=None)
    is_late: bool = Field(default=False)
    plagiarism_score: Optional[float] = Field(default=None, ge=0, le=100)
    status: str = Field(default="submitted")


class SubmissionCreate(SubmissionBase):
    """Submission creation schema"""
    pass


class SubmissionUpdate(BaseModel):
    """Submission update schema"""
    file_name: Optional[str] = Field(default=None, max_length=255)
    file_path: Optional[str] = Field(default=None, max_length=500)
    file_size: Optional[int] = Field(default=None, ge=0)
    mime_type: Optional[str] = Field(default=None, max_length=100)
    submission_text: Optional[str] = Field(default=None)
    is_late: Optional[bool] = Field(default=None)
    plagiarism_score: Optional[float] = Field(default=None, ge=0, le=100)
    status: Optional[str] = Field(default=None)


class SubmissionResponse(BaseModel):
    """Submission response schema"""
    id: int
    assignment_id: int
    assignment_title: Optional[str] = None
    student_id: int
    student_name: Optional[str] = None
    file_name: str
    file_path: str
    file_size: int
    mime_type: str
    submission_text: Optional[str] = None
    is_late: bool
    plagiarism_score: Optional[float] = None
    status: str
    submitted_at: datetime
    graded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    grade: Optional[float] = None
    feedback: Optional[str] = None
    
    class Config:
        from_attributes = True


class SubmissionListResponse(BaseModel):
    """Submission list response"""
    submissions: List[SubmissionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


__all__ = [
    "SubmissionBase",
    "SubmissionCreate",
    "SubmissionUpdate",
    "SubmissionResponse",
    "SubmissionListResponse",
]