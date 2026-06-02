from __future__ import annotations

import sys
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID

from .....models.labeled_contact_items import LabeledEmailItem, LabeledPhoneItem
from .....models.common import (
    LeadStatus,
    LeadSource,
    OpportunityStage,
    ContactType,
    ActivityType,
    CompanySize,
    QuoteStatus,
    ContractStatus,
    Industry,
    Pagination,
)

class LeadBase(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    leadSource: Optional[LeadSource] = LeadSource.WEBSITE
    status: LeadStatus = LeadStatus.NEW
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []
    estimatedValue: Optional[float] = None
    expectedCloseDate: Optional[str] = None
    score: int = 0
    budget: Optional[float] = None
    timeline: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    jobTitle: Optional[str] = None
    leadSource: Optional[LeadSource] = None
    status: Optional[LeadStatus] = None
    assignedTo: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    estimatedValue: Optional[float] = None
    expectedCloseDate: Optional[str] = None
    score: Optional[int] = None
    budget: Optional[float] = None
    timeline: Optional[str] = None

class Lead(LeadBase):
    id: UUID
    tenant_id: UUID
    createdBy: Optional[str] = None
    assignedToUser: Optional[Dict[str, str]] = None
    convertedToContact: Optional[str] = None
    convertedToOpportunity: Optional[str] = None
    lastContactDate: Optional[datetime] = None
    nextFollowUpDate: Optional[datetime] = None
    activities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    @field_validator("assignedTo", mode="before")
    @classmethod
    def coerce_assigned_to(cls, v):
        if v is None:
            return None
        if hasattr(v, "id"):
            return str(v.id)
        if isinstance(v, str) and not v.strip():
            return None
        return str(v)

    @field_validator("leadSource", mode="before")
    @classmethod
    def normalize_lead_source(cls, v):
        if v is None or v == "":
            return None
        value = v.value if hasattr(v, "value") else str(v)
        allowed = {item.value for item in LeadSource}
        if value not in allowed:
            return LeadSource.OTHER.value
        return value

    class Config:
        from_attributes = True



class LeadsResponse(BaseModel):
    leads: List[Lead]
    pagination: Pagination


class CRMLeadsResponse(BaseModel):
    leads: List[Lead]
    pagination: Pagination
