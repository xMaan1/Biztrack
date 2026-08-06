"""
Grade Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class GradeBase(BaseModel):
    """Base grade schema"""
    enrollment_id: int = Field(..., description="Enrollment ID")
    assignment_id: Optional[int] = Field(default=None, description="Assignment ID")
    score: Optional[float] = Field(default=None, ge=0, description="Score")
    letter_grade: Optional[str] = Field(default=None, max_length=5)
    percentage: Optional[float] = Field(default=None, ge=0, le=100)
    feedback: Optional[str] = Field(default=None)
    graded_by: Optional[int] = Field(default=None, description="Grader user ID")


class GradeCreate(GradeBase):
    """Grade creation schema"""
    pass


class GradeUpdate(BaseModel):
    """Grade update schema"""
    score: Optional[float] = Field(default=None, ge=0)
    letter_grade: Optional[str] = Field(default=None, max_length=5)
    percentage: Optional[float] = Field(default=None, ge=0, le=100)
    feedback: Optional[str] = Field(default=None)
    graded_by: Optional[int] = Field(default=None)


class GradeResponse(BaseModel):
    """Grade response schema"""
    id: int
    enrollment_id: int
    assignment_id: Optional[int] = None
    assignment_title: Optional[str] = None
    score: Optional[float] = None
    letter_grade: Optional[str] = None
    percentage: Optional[float] = None
    feedback: Optional[str] = None
    graded_by: Optional[int] = None
    grader_name: Optional[str] = None
    graded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class GradeListResponse(BaseModel):
    """Grade list response"""
    grades: List[GradeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class GradeSummaryResponse(BaseModel):
    """Grade summary response"""
    student_id: int
    student_name: str
    course_id: int
    course_title: str
    total_assignments: int
    graded_assignments: int
    average_score: Optional[float] = None
    letter_grade: Optional[str] = None
    overall_percentage: Optional[float] = None


__all__ = [
    "GradeBase",
    "GradeCreate",
    "GradeUpdate",
    "GradeResponse",
    "GradeListResponse",
    "GradeSummaryResponse",
]