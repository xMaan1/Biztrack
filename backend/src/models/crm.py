from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class CustomerAttachmentItem(BaseModel):
    url: str
    original_filename: Optional[str] = None
    s3_key: Optional[str] = None

# Customer Models
class CustomerBase(BaseModel):
    firstName: str = Field(..., min_length=1, max_length=100)
    lastName: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    phone: Optional[str] = Field(None, max_length=20)

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        if v == "" or v is None:
            return None
        return v
    mobile: Optional[str] = Field(None, max_length=20)
    cnic: Optional[str] = Field(None, max_length=15)
    dateOfBirth: Optional[datetime] = None
    gender: Optional[str] = Field(None, pattern=r"^(male|female|other)$")
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(default="Pakistan", max_length=100)
    postalCode: Optional[str] = Field(None, max_length=20)
    customerType: Optional[str] = Field(default="individual", pattern=r"^(individual|business)$")
    customerStatus: Optional[str] = Field(default="active", pattern=r"^(active|inactive|blocked)$")
    creditLimit: Optional[float] = Field(default=0.0, ge=0)
    currentBalance: Optional[float] = Field(default=0.0)
    paymentTerms: Optional[str] = Field(default="Cash", pattern=r"^(Credit|Card|Cash|Due Payments|immediate|net30|net60)$")
    assignedToId: Optional[UUID] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)
    attachments: List[CustomerAttachmentItem] = Field(default_factory=list)
    image_url: Optional[str] = None

    @field_validator("attachments", mode="before")
    @classmethod
    def normalize_attachments(cls, v):
        if v is None:
            return []
        out = []
        for item in v:
            if isinstance(item, str):
                out.append({"url": item})
            elif isinstance(item, dict):
                out.append(item)
        return out

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    firstName: Optional[str] = Field(None, min_length=1, max_length=100)
    lastName: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, pattern=r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    phone: Optional[str] = Field(None, max_length=20)
    mobile: Optional[str] = Field(None, max_length=20)
    cnic: Optional[str] = Field(None, max_length=15)
    dateOfBirth: Optional[datetime] = None
    gender: Optional[str] = Field(None, pattern=r"^(male|female|other)$")
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)
    postalCode: Optional[str] = Field(None, max_length=20)
    customerType: Optional[str] = Field(None, pattern=r"^(individual|business)$")
    customerStatus: Optional[str] = Field(None, pattern=r"^(active|inactive|blocked)$")
    creditLimit: Optional[float] = Field(None, ge=0)
    currentBalance: Optional[float] = None
    paymentTerms: Optional[str] = Field(None, pattern=r"^(Credit|Card|Cash|Due Payments|immediate|net30|net60)$")
    assignedToId: Optional[UUID] = None
    notes: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[CustomerAttachmentItem]] = None
    image_url: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: UUID
    customerId: str
    tenant_id: UUID
    isActive: bool
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True

class CustomersListResponse(BaseModel):
    customers: List[CustomerResponse]
    total: int

class CustomerStatsResponse(BaseModel):
    total_customers: int
    active_customers: int
    inactive_customers: int
    blocked_customers: int
    individual_customers: int
    business_customers: int
    recent_customers: int


class GuarantorBase(BaseModel):
    name: str
    mobile: Optional[str] = None
    cnic: Optional[str] = None
    residential_address: Optional[str] = None
    official_address: Optional[str] = None
    occupation: Optional[str] = None
    relation: Optional[str] = None
    display_order: Optional[int] = 0


class GuarantorCreate(GuarantorBase):
    pass


class GuarantorUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    cnic: Optional[str] = None
    residential_address: Optional[str] = None
    official_address: Optional[str] = None
    occupation: Optional[str] = None
    relation: Optional[str] = None
    display_order: Optional[int] = None


class GuarantorResponse(GuarantorBase):
    id: UUID
    tenant_id: UUID
    customer_id: UUID
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        from_attributes = True


