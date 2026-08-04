"""
Assignment Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class AssignmentBase(BaseModel):
    """Base assignment schema"""
    course_id: int = Field(..., description="Course ID")
    title: str = Field(..., min_length=1, max_length=255, description="Assignment title")
    description: Optional[str] = Field(default=None, description="Assignment description")
    instructions: Optional[str] = Field(default=None, description="Instructions")
    max_score: float = Field(default=100.0, ge=0, description="Maximum score")
    deadline: datetime = Field(..., description="Submission deadline")
    is_published: bool = Field(default=False)
    allow_late_submission: bool = Field(default=False)
    late_submission_penalty: float = Field(default=0.0, ge=0, le=100)
    max_file_size: int = Field(default=10485760, description="Max file size in bytes")
    allowed_file_types: str = Field(default=".pdf,.doc,.docx,.zip")


class AssignmentCreate(AssignmentBase):
    """Assignment creation schema"""
    pass


class AssignmentUpdate(BaseModel):
    """Assignment update schema"""
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None)
    instructions: Optional[str] = Field(default=None)
    max_score: Optional[float] = Field(default=None, ge=0)
    deadline: Optional[datetime] = Field(default=None)
    is_published: Optional[bool] = Field(default=None)
    allow_late_submission: Optional[bool] = Field(default=None)
    late_submission_penalty: Optional[float] = Field(default=None, ge=0, le=100)
    max_file_size: Optional[int] = Field(default=None)
    allowed_file_types: Optional[str] = Field(default=None)


class AssignmentResponse(BaseModel):
    """Assignment response schema"""
    id: int
    course_id: int
    course_title: Optional[str] = None
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    max_score: float
    deadline: datetime
    is_published: bool
    allow_late_submission: bool
    late_submission_penalty: float
    max_file_size: int
    allowed_file_types: str
    created_at: datetime
    updated_at: datetime
    submissions_count: Optional[int] = 0
    graded_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


class AssignmentListResponse(BaseModel):
    """Assignment list response"""
    assignments: List[AssignmentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


__all__ = [
    "AssignmentBase",
    "AssignmentCreate",
    "AssignmentUpdate",
    "AssignmentResponse",
    "AssignmentListResponse",
]