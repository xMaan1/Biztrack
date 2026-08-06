"""
Common Pydantic Schemas
"""

from typing import Optional, Any, Dict, List, Generic, TypeVar
from pydantic import BaseModel, Field, validator
from datetime import datetime

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    sort_by: Optional[str] = Field(default=None, description="Sort field")
    sort_order: str = Field(default="asc", description="Sort order (asc/desc)")
    search: Optional[str] = Field(default=None, description="Search term")
    
    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('sort_order must be "asc" or "desc"')
        return v


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response"""
    items: List[T] = Field(..., description="List of items")
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")
    has_next: bool = Field(..., description="Has next page")
    has_previous: bool = Field(..., description="Has previous page")


class ResponseWrapper(BaseModel):
    """Standard API response wrapper"""
    success: bool = Field(..., description="Whether the request was successful")
    message: str = Field(default="Operation successful", description="Response message")
    data: Optional[Any] = Field(default=None, description="Response data")
    errors: Optional[List[Dict[str, str]]] = Field(default=None, description="Validation errors")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: Dict[str, Any] = Field(..., description="Error details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": {
                    "code": "AUTH_ERROR",
                    "message": "Invalid credentials",
                    "details": {"field": "email"}
                }
            }
        }


class ValidationErrorResponse(BaseModel):
    """Validation error response"""
    errors: List[Dict[str, Any]] = Field(..., description="Validation errors")
    
    class Config:
        json_schema_extra = {
            "example": {
                "errors": [
                    {
                        "field": "email",
                        "message": "Invalid email format",
                        "code": "INVALID_FORMAT"
                    }
                ]
            }
        }


__all__ = [
    "PaginationParams",
    "PaginatedResponse",
    "ResponseWrapper",
    "ErrorResponse",
    "ValidationErrorResponse",
]