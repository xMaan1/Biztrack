from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class PaginationModel(BaseModel):
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=100)
    total: int = Field(default=0, ge=0)
    pages: int = Field(default=0, ge=0)

class BaseResponseModel(BaseModel):
    id: str
    tenant_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

