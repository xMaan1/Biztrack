from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VehicleCreate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    color: Optional[str] = None
    vin: Optional[str] = None
    registration_number: Optional[str] = None
    mileage: Optional[str] = None
    customer_id: Optional[str] = None
    notes: Optional[str] = None


class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    color: Optional[str] = None
    vin: Optional[str] = None
    registration_number: Optional[str] = None
    mileage: Optional[str] = None
    customer_id: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class VehicleResponse(BaseModel):
    id: str
    tenant_id: str
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    color: Optional[str] = None
    vin: Optional[str] = None
    registration_number: Optional[str] = None
    mileage: Optional[str] = None
    customer_id: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
