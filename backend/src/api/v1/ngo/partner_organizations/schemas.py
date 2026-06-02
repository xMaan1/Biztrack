from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

PARTNER_SECTORS = ("relief", "medical", "education", "food")
PARTNER_SIZES = ("small", "medium", "large")
PARTNER_STATUSES = ("active", "inactive")


class PartnerOrganizationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=3, max_length=255)
    sector: str = Field(default="relief")
    organization_size: str = Field(default="medium")
    website: Optional[str] = Field(None, max_length=512)
    location: Optional[str] = Field(None, max_length=512)
    status: str = Field(default="active")

    @field_validator("sector")
    @classmethod
    def validate_sector(cls, v: str) -> str:
        key = (v or "relief").strip().lower()
        if key not in PARTNER_SECTORS:
            raise ValueError(f"sector must be one of: {', '.join(PARTNER_SECTORS)}")
        return key

    @field_validator("organization_size")
    @classmethod
    def validate_size(cls, v: str) -> str:
        key = (v or "medium").strip().lower()
        if key not in PARTNER_SIZES:
            raise ValueError(f"organization_size must be one of: {', '.join(PARTNER_SIZES)}")
        return key

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        key = (v or "active").strip().lower()
        if key not in PARTNER_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(PARTNER_STATUSES)}")
        return key

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return (v or "").strip().lower()


class PartnerOrganizationCreate(PartnerOrganizationBase):
    pass


class PartnerOrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[str] = Field(None, min_length=3, max_length=255)
    sector: Optional[str] = None
    organization_size: Optional[str] = None
    website: Optional[str] = Field(None, max_length=512)
    location: Optional[str] = Field(None, max_length=512)
    status: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("sector")
    @classmethod
    def validate_sector(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower()
        if key not in PARTNER_SECTORS:
            raise ValueError(f"sector must be one of: {', '.join(PARTNER_SECTORS)}")
        return key

    @field_validator("organization_size")
    @classmethod
    def validate_size(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower()
        if key not in PARTNER_SIZES:
            raise ValueError(f"organization_size must be one of: {', '.join(PARTNER_SIZES)}")
        return key

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        key = v.strip().lower()
        if key not in PARTNER_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(PARTNER_STATUSES)}")
        return key

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return v.strip().lower()


class PartnerOrganization(PartnerOrganizationBase):
    id: str
    tenant_id: str
    partner_code: str
    is_active: bool = True
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class PartnerOrganizationsResponse(BaseModel):
    organizations: List[PartnerOrganization]
    total: int
