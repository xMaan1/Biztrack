from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class MotRetailerBase(BaseModel):
    name: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    county: Optional[str] = None
    postcode: str
    phone: Optional[str] = None
    email: Optional[str] = None
    is_default: bool = False


class MotRetailerCreate(MotRetailerBase):
    pass


class MotRetailerUpdate(BaseModel):
    name: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    postcode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


class MotRetailer(MotRetailerBase):
    id: str
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MotRetailersResponse(BaseModel):
    retailers: List[MotRetailer]
    total: int
