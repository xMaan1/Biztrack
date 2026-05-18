from pydantic import BaseModel, Field

from app.features.tenants.constants import PlanType


class CreateTenantRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    plan_type: PlanType


class TenantSummary(BaseModel):
    id: str
    name: str
    plan_type: PlanType
