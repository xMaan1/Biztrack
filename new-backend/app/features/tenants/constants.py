from enum import StrEnum


class PlanType(StrEnum):
    STARTER = "starter"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


PLAN_TYPES = {p.value for p in PlanType}
