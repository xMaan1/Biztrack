"""
Course Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime, date


class CourseBase(BaseModel):
    """Base course schema"""
    title: str = Field(..., min_length=1, max_length=255, description="Course title")
    code: str = Field(..., min_length=1, max_length=50, description="Course code")
    description: Optional[str] = Field(default=None, description="Course description")
    credits: int = Field(default=3, ge=1, le=10, description="Course credits")
    department_id: int = Field(..., description="Department ID")
    teacher_id: int = Field(..., description="Teacher ID")
    semester: str = Field(..., description="Semester (e.g., Fall 2024)")
    academic_year: str = Field(..., description="Academic year (e.g., 2024-2025)")
    max_students: int = Field(default=30, ge=1, description="Maximum students")
    start_date: date = Field(..., description="Start date")
    end_date: date = Field(..., description="End date")
    is_published: bool = Field(default=False, description="Is published")
    thumbnail_url: Optional[str] = Field(default=None, max_length=500)
    syllabus_url: Optional[str] = Field(default=None, max_length=500)

    @field_validator('description', mode='before')
    @classmethod
    def empty_str_to_none(cls, v):
        if v == '':
            return None
        return v

    @model_validator(mode='after')
    def validate_dates(self):
        if self.end_date and self.start_date and self.end_date < self.start_date:
            raise ValueError('End date must be after start date')
        return self


class CourseCreate(CourseBase):
    """Course creation schema"""
    pass


class CourseUpdate(BaseModel):
    """Course update schema"""
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    code: Optional[str] = Field(default=None, min_length=1, max_length=50)
    description: Optional[str] = Field(default=None)
    credits: Optional[int] = Field(default=None, ge=1, le=10)
    department_id: Optional[int] = Field(default=None)
    teacher_id: Optional[int] = Field(default=None)
    semester: Optional[str] = Field(default=None)
    academic_year: Optional[str] = Field(default=None)
    max_students: Optional[int] = Field(default=None, ge=1)
    start_date: Optional[date] = Field(default=None)
    end_date: Optional[date] = Field(default=None)
    is_published: Optional[bool] = Field(default=None)
    thumbnail_url: Optional[str] = Field(default=None, max_length=500)
    syllabus_url: Optional[str] = Field(default=None, max_length=500)


class CourseResponse(BaseModel):
    """Course response schema"""
    id: int
    title: str
    code: str
    description: Optional[str] = None
    credits: int
    department_id: int
    department_name: Optional[str] = None
    teacher_id: int
    teacher_name: Optional[str] = None
    semester: str
    academic_year: str
    max_students: int
    current_enrollment: Optional[int] = 0
    start_date: date
    end_date: date
    is_published: bool
    thumbnail_url: Optional[str] = None
    syllabus_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    """Course list response"""
    courses: List[CourseResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


__all__ = [
    "CourseBase",
    "CourseCreate",
    "CourseUpdate",
    "CourseResponse",
    "CourseListResponse",
]