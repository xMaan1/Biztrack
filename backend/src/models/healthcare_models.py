from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class DoctorAvailabilitySlot(BaseModel):
    day: str
    start_time: str
    end_time: str


class DoctorBase(BaseModel):
    pmdc_number: str
    phone: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    address: Optional[str] = None
    availability: List[DoctorAvailabilitySlot] = []


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    pmdc_number: Optional[str] = None
    phone: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    address: Optional[str] = None
    availability: Optional[List[DoctorAvailabilitySlot]] = None
    is_active: Optional[bool] = None


class Doctor(DoctorBase):
    id: str
    tenant_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class DoctorsResponse(BaseModel):
    doctors: List[Doctor]
    total: int


class HealthcareStaffBase(BaseModel):
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    permissions: List[str] = []


class HealthcareStaffCreate(HealthcareStaffBase):
    password: str


class HealthcareStaffUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[List[str]] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class HealthcareStaff(HealthcareStaffBase):
    id: str
    tenant_id: str
    user_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class HealthcareStaffResponse(BaseModel):
    staff: List[HealthcareStaff]
    total: int
