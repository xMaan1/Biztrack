"""
Department Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class DepartmentBase(BaseModel):
    """Base department schema"""
    name: str = Field(..., min_length=1, max_length=100, description="Department name")
    code: str = Field(..., min_length=1, max_length=20, description="Department code")
    description: Optional[str] = Field(default=None, description="Department description")
    head_teacher_id: Optional[int] = Field(default=None, description="Head teacher ID")


class DepartmentCreate(DepartmentBase):
    """Department creation schema"""
    pass


class DepartmentUpdate(BaseModel):
    """Department update schema"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    code: Optional[str] = Field(default=None, min_length=1, max_length=20)
    description: Optional[str] = Field(default=None)
    head_teacher_id: Optional[int] = Field(default=None)


class DepartmentResponse(BaseModel):
    """Department response schema"""
    id: int
    name: str
    code: str
    description: Optional[str] = None
    head_teacher_id: Optional[int] = None
    head_teacher_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


__all__ = [
    "DepartmentBase",
    "DepartmentCreate",
    "DepartmentUpdate",
    "DepartmentResponse",
]