from __future__ import annotations

import sys
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID

from .....models.labeled_contact_items import LabeledEmailItem, LabeledPhoneItem
from .....models.crm.enums import (
    LeadStatus,
    LeadSource,
    OpportunityStage,
    ContactType,
    ActivityType,
    CompanySize,
    QuoteStatus,
    ContractStatus,
    Industry,
)
from .....models.common import Pagination

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
    email: str
    createdBy: Optional[str] = None
    assignedToUser: Optional[Dict[str, str]] = None
    convertedToContact: Optional[str] = None
    convertedToOpportunity: Optional[str] = None
    lastContactDate: Optional[datetime] = None
    nextFollowUpDate: Optional[datetime] = None
    activities: List[Dict[str, Any]] = []
    createdAt: datetime
    updatedAt: datetime

    @model_validator(mode="before")
    @classmethod
    def hydrate_lead_orm(cls, data: Any):
        if data is None or not hasattr(data, "_sa_instance_state"):
            return data
        from sqlalchemy.inspection import inspect as sa_inspect

        out = {}
        for attr in sa_inspect(data).mapper.column_attrs:
            out[attr.key] = getattr(data, attr.key)
        aid = out.pop("assignedToId", None)
        out["assignedTo"] = str(aid) if aid is not None else None
        cid = out.pop("createdById", None)
        out["createdBy"] = str(cid) if cid is not None else None
        if out.get("tags") is None:
            out["tags"] = []
        ls = out.get("leadSource")
        if ls is None or ls == "":
            out["leadSource"] = LeadSource.OTHER.value
        else:
            value = ls.value if hasattr(ls, "value") else str(ls)
            allowed_sources = {item.value for item in LeadSource}
            out["leadSource"] = value if value in allowed_sources else LeadSource.OTHER.value
        st = out.get("status")
        status_map = {
            "converted": LeadStatus.WON.value,
            "proposal": LeadStatus.PROPOSAL_SENT.value,
            "closed": LeadStatus.WON.value,
        }
        allowed_statuses = {item.value for item in LeadStatus}
        if not st:
            out["status"] = LeadStatus.NEW.value
        else:
            value = st.value if hasattr(st, "value") else str(st)
            if value in allowed_statuses:
                out["status"] = value
            else:
                out["status"] = status_map.get(value, LeadStatus.NEW.value)
        return out

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
            return LeadSource.OTHER.value
        value = v.value if hasattr(v, "value") else str(v)
        allowed = {item.value for item in LeadSource}
        if value not in allowed:
            return LeadSource.OTHER.value
        return value

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        if v is None or v == "":
            return LeadStatus.NEW.value
        value = v.value if hasattr(v, "value") else str(v)
        allowed = {item.value for item in LeadStatus}
        if value in allowed:
            return value
        return {
            "converted": LeadStatus.WON.value,
            "proposal": LeadStatus.PROPOSAL_SENT.value,
            "closed": LeadStatus.WON.value,
        }.get(value, LeadStatus.NEW.value)

    class Config:
        from_attributes = True



class LeadsResponse(BaseModel):
    leads: List[Lead]
    pagination: Pagination


class CRMLeadsResponse(BaseModel):
    leads: List[Lead]
    pagination: Pagination
