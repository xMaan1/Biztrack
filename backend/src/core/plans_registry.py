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
    "commerce": PlanDefinition(
        name="Commerce Pro",
        description="All-in-one solution for retail and e-commerce businesses",
        planType="commerce",
        price=49.99,
        billingCycle="monthly",
        maxProjects=50,
        maxUsers=15,
        features=[
            "POS System",
            "Sales & Invoicing",
            "CRM",
            "Inventory Management",
            "Supplier Management",
            "Purchase Orders",
            "Financial Reports",
            "Multi-user Access",
            "Delivery Notes",
            "File Uploads",
            "Email Notifications",
            "API Access",
        ],
    ),
    "workshop": PlanDefinition(
        name="Workshop Master",
        description="Purpose-built for automotive workshops and repair centers",
        planType="workshop",
        price=49.99,
        billingCycle="monthly",
        maxProjects=50,
        maxUsers=15,
        features=[
            "Work Order Management",
            "Job Cards",
            "Vehicle Management",
            "MOT Management",
            "Inventory Management",
            "Supplier Management",
            "Purchase Orders",
            "Sales & Invoicing",
            "CRM",
            "Project Management",
            "Financial Reports",
            "Multi-user Access",
        ],
    ),
    "healthcare": PlanDefinition(
        name="Healthcare Suite",
        description="Comprehensive management platform for healthcare providers",
        planType="healthcare",
        price=49.99,
        billingCycle="monthly",
        maxProjects=50,
        maxUsers=15,
        features=[
            "Patient Management",
            "Appointment Scheduling",
            "Prescriptions",
            "Doctor Management",
            "Staff Management",
            "Daily Expenses",
            "Admissions",
            "Sales & Invoicing",
            "CRM",
            "Financial Reports",
            "Multi-user Access",
            "File Uploads",
        ],
    ),
    "ngo": PlanDefinition(
        name="NGO Impact",
        description="Affordable management tools for non-profits and social enterprises",
        planType="ngo",
        price=29.99,
        billingCycle="monthly",
        maxProjects=100,
        maxUsers=25,
        features=[
            "Donor Management",
            "Project Management",
            "Task Management",
            "Sales & Invoicing",
            "CRM",
            "Financial Reports",
            "Multi-user Access",
            "File Uploads",
            "Email Notifications",
            "Custom Fields",
            "API Access",
            "Priority Support",
        ],
    ),
}
