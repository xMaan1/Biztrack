"""
Role Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class RoleBase(BaseModel):
    """Base role schema"""
    name: str = Field(..., min_length=1, max_length=50, description="Role name")
    description: Optional[str] = Field(default=None, description="Role description")


class RoleCreate(RoleBase):
    """Role creation schema"""
    pass


class RoleUpdate(BaseModel):
    """Role update schema"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    description: Optional[str] = Field(default=None)


class RoleResponse(BaseModel):
    """Role response schema"""
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


__all__ = [
    "RoleBase",
    "RoleCreate",
    "RoleUpdate",
    "RoleResponse",
]