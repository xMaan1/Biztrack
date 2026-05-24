from enum import StrEnum

__all__ = ["PlanType", "TenantMemberRole", "PLAN_TYPES", "TENANT_MEMBER_ROLES"]


class PlanType(StrEnum):
    HEALTHCARE = "healthcare"
    COMMERCE = "commerce"
    WORKSHOP = "workshop"


class TenantMemberRole(StrEnum):
    OWNER = "owner"
    MEMBER = "member"


PLAN_TYPES = {p.value for p in PlanType}
TENANT_MEMBER_ROLES = {r.value for r in TenantMemberRole}
