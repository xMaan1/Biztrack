"""
Lecture Schemas
"""

from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class LectureBase(BaseModel):
    """Base lecture schema"""
    course_id: int = Field(..., description="Course ID")
    title: str = Field(..., min_length=1, max_length=255, description="Lecture title")
    description: Optional[str] = Field(default=None, description="Lecture description")
    lecture_number: int = Field(..., ge=1, description="Lecture number")
    video_url: Optional[str] = Field(default=None, max_length=500)
    video_duration: Optional[int] = Field(default=None, description="Duration in seconds")
    thumbnail_url: Optional[str] = Field(default=None, max_length=500)
    is_published: bool = Field(default=False)
    is_free_preview: bool = Field(default=False)
    order_index: int = Field(default=0)


class LectureCreate(BaseModel):
    """Lecture creation schema"""
    title: str = Field(..., min_length=1, max_length=255, description="Lecture title")
    description: Optional[str] = Field(default=None, description="Lecture description")
    lecture_number: int = Field(..., ge=1, description="Lecture number")
    is_published: bool = Field(default=False)
    is_free_preview: bool = Field(default=False)


class LectureUpdate(BaseModel):
    """Lecture update schema"""
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None)
    lecture_number: Optional[int] = Field(default=None, ge=1)
    video_url: Optional[str] = Field(default=None, max_length=500)
    video_duration: Optional[int] = Field(default=None)
    thumbnail_url: Optional[str] = Field(default=None, max_length=500)
    is_published: Optional[bool] = Field(default=None)
    is_free_preview: Optional[bool] = Field(default=None)
    order_index: Optional[int] = Field(default=None)


class LectureResponse(BaseModel):
    """Lecture response schema"""
    id: int
    course_id: int
    title: str
    description: Optional[str] = None
    lecture_number: int
    video_url: Optional[str] = None
    video_duration: Optional[int] = None
    thumbnail_url: Optional[str] = None
    is_published: bool = False
    is_free_preview: bool = False
    order_index: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    materials_count: Optional[int] = 0
    progress_percentage: Optional[float] = None
    is_completed: Optional[bool] = None
    
    class Config:
        from_attributes = True


class LectureListResponse(BaseModel):
    """Lecture list response"""
    lectures: List[LectureResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


__all__ = [
    "LectureBase",
    "LectureCreate",
    "LectureUpdate",
    "LectureResponse",
    "LectureListResponse",
]