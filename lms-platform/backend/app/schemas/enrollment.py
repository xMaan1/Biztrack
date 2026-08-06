"""
Enrollment Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class EnrollmentBase(BaseModel):
    """Base enrollment schema"""
    course_id: int = Field(..., description="Course ID")
    student_id: int = Field(..., description="Student ID")
    status: str = Field(default="pending", description="Enrollment status")
    grade: Optional[str] = Field(default=None, description="Grade")
    grade_points: Optional[float] = Field(default=None, description="Grade points")
    completion_percentage: float = Field(default=0.0, ge=0, le=100)


class EnrollmentCreate(BaseModel):
    """Enrollment creation schema"""
    course_id: int = Field(..., description="Course ID")
    student_id: int = Field(..., description="Student ID")
    status: str = Field(default="active", description="Enrollment status")


class EnrollmentUpdate(BaseModel):
    """Enrollment update schema"""
    status: Optional[str] = Field(default=None, description="Enrollment status")
    grade: Optional[str] = Field(default=None, description="Grade")
    grade_points: Optional[float] = Field(default=None, description="Grade points")
    completion_percentage: Optional[float] = Field(default=None, ge=0, le=100)


class EnrollmentResponse(BaseModel):
    """Enrollment response schema"""
    id: int
    course_id: int
    course_title: Optional[str] = None
    course_code: Optional[str] = None
    student_id: int
    student_name: Optional[str] = None
    enrollment_date: datetime
    status: str
    grade: Optional[str] = None
    grade_points: Optional[float] = None
    completion_percentage: float
    dropped_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class EnrollmentListResponse(BaseModel):
    """Enrollment list response"""
    enrollments: list[EnrollmentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


__all__ = [
    "EnrollmentBase",
    "EnrollmentCreate",
    "EnrollmentUpdate",
    "EnrollmentResponse",
    "EnrollmentListResponse",
]