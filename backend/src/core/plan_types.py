from typing import Optional

RETAIL_PLAN_TYPES = frozenset({"commerce", "agency"})


def is_retail_plan(plan_type: Optional[str]) -> bool:
    return (plan_type or "").lower() in RETAIL_PLAN_TYPES


def is_commerce_plan(plan_type: Optional[str]) -> bool:
    return (plan_type or "").lower() == "commerce"


def is_agency_plan(plan_type: Optional[str]) -> bool:
    return (plan_type or "").lower() == "agency"
