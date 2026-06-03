from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

DONOR_LEAD_STATUSES = ("new", "contacted", "qualified", "converted", "lost")
DONOR_LEAD_SOURCES = ("website", "event", "referral", "social_media", "campaign", "other")


class DonorLeadBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    organization: Optional[str] = Field(None, max_length=255)
    expected_donation: float = Field(default=0, ge=0)
    status: str = Field(default="new")
    source: str = Field(default="other")
    assigned_to: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        key = (v or "new").strip().lower()
        if key not in DONOR_LEAD_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(DONOR_LEAD_STATUSES)}")
        return key

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: str) -> str:
        key = (v or "other").strip().lower().replace(" ", "_")
        if key == "socialmedia":
            key = "social_media"
        if key not in DONOR_LEAD_SOURCES:
            raise ValueError(f"source must be one of: {', '.join(DONOR_LEAD_SOURCES)}")
        return key

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return (v or "").strip().lower()


class DonorLeadCreate(DonorLeadBase):
    pass


class DonorLeadUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, min_length=3, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    organization: Optional[str] = Field(None, max_length=255)
    expected_donation: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None
    source: Optional[str] = None
    assigned_to: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower()
        if key not in DONOR_LEAD_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(DONOR_LEAD_STATUSES)}")
        return key

    @field_validator("source")
    @classmethod
    def validate_source(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower().replace(" ", "_")
        if key == "socialmedia":
            key = "social_media"
        if key not in DONOR_LEAD_SOURCES:
            raise ValueError(f"source must be one of: {', '.join(DONOR_LEAD_SOURCES)}")
        return key

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return v.strip().lower()


class DonorLead(DonorLeadBase):
    id: str
    tenant_id: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class DonorLeadsResponse(BaseModel):
    leads: List[DonorLead]
    total: int
