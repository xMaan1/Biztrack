"""
Material Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class MaterialBase(BaseModel):
    """Base material schema"""
    lecture_id: int = Field(..., description="Lecture ID")
    title: str = Field(..., min_length=1, max_length=255, description="Material title")
    file_name: str = Field(..., max_length=255, description="File name")
    file_path: str = Field(..., max_length=500, description="File path")
    file_size: int = Field(..., ge=0, description="File size in bytes")
    mime_type: str = Field(..., max_length=100, description="MIME type")
    is_downloadable: bool = Field(default=True)


class MaterialCreate(MaterialBase):
    """Material creation schema"""
    pass


class MaterialUpdate(BaseModel):
    """Material update schema"""
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    file_name: Optional[str] = Field(default=None, max_length=255)
    file_path: Optional[str] = Field(default=None, max_length=500)
    file_size: Optional[int] = Field(default=None, ge=0)
    mime_type: Optional[str] = Field(default=None, max_length=100)
    is_downloadable: Optional[bool] = Field(default=None)


class MaterialResponse(BaseModel):
    """Material response schema"""
    id: int
    lecture_id: int
    title: str
    file_name: str
    file_path: str
    file_size: int
    mime_type: str
    is_downloadable: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Export all schemas
__all__ = [
    "MaterialBase",
    "MaterialCreate",
    "MaterialUpdate",
    "MaterialResponse",
]