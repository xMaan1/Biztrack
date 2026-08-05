import json
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class PlanDefinition:
    name: str
    description: str
    planType: str
    price: float
    billingCycle: str
    maxProjects: int
    maxUsers: int
    features: List[str]


def plan_to_dict(plan: PlanDefinition) -> dict:
    return {
        "name": plan.name,
        "description": plan.description,
        "planType": plan.planType,
        "price": plan.price,
        "billingCycle": plan.billingCycle,
        "maxProjects": plan.maxProjects,
        "maxUsers": plan.maxUsers,
        "features": plan.features,
    }


PLANS = {
    "agency": PlanDefinition(
        name="Agency Pro",
        description="Complete business management for marketing and creative agencies",
        planType="agency",
        price=49.99,
        billingCycle="monthly",
        maxProjects=50,
        maxUsers=15,
        features=[
            "Sales & Invoicing",
            "CRM",
            "Project Management",
            "Task Management",
            "Time Tracking",
            "Inventory Management",
            "Financial Reports",
            "Multi-user Access",
            "Work Order Management",
            "File Uploads",
            "Email Notifications",
            "API Access",
        ],
    ),
}
