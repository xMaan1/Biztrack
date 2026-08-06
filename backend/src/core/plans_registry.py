"""Central registry of all subscription plan definitions for BizTrack.

This is the single source of truth used by ``backend/scripts/seed.py`` to
populate the ``plans`` table. Each definition maps to a row in the DB.
"""

from typing import Any, Dict, List


class PlanDefinition:
    def __init__(
        self,
        name: str,
        description: str,
        plan_type: str,
        price: float,
        billing_cycle: str,
        max_projects: int,
        max_users: int,
        features: List[str],
    ) -> None:
        self.name = name
        self.description = description
        self.plan_type = plan_type
        self.price = price
        self.billing_cycle = billing_cycle
        self.max_projects = max_projects
        self.max_users = max_users
        self.features = features

    @property
    def planType(self) -> str:
        return self.plan_type

    @property
    def billingCycle(self) -> str:
        return self.billing_cycle

    @property
    def maxProjects(self) -> int:
        return self.max_projects

    @property
    def maxUsers(self) -> int:
        return self.max_users


def _d(*args, **kwargs) -> PlanDefinition:
    return PlanDefinition(*args, **kwargs)


PLANS: Dict[str, PlanDefinition] = {
    "agency": _d(
        name="Agency Pro",
        description="CRM, sales, and invoicing for agencies managing clients and campaigns.",
        plan_type="agency",
        price=49,
        billing_cycle="monthly",
        max_projects=10,
        max_users=25,
        features=[
            "crm",
            "hrm",
            "inventory",
            "Client Management",
            "Sales & Invoicing",
            "Campaign Tracking",
            "Customer Portal",
            "Advanced Reporting",
            "Email Marketing",
        ],
    ),
    "commerce": _d(
        name="Commerce Pro",
        description="Retail and distribution ERP with POS, invoicing, warehouses, and analytics.",
        plan_type="commerce",
        price=49,
        billing_cycle="monthly",
        max_projects=10,
        max_users=25,
        features=[
            "crm",
            "hrm",
            "inventory",
            "pos",
            "Point of Sale (POS)",
            "Sales & Invoicing",
            "Warehouse Management",
            "Multi-location Support",
            "Financial Reports",
            "E-commerce Integration",
        ],
    ),
    "workshop": _d(
        name="Workshop Master",
        description="Production, work orders, job cards, quality control, and equipment maintenance.",
        plan_type="workshop",
        price=39,
        billing_cycle="monthly",
        max_projects=5,
        max_users=15,
        features=[
            "hrm",
            "inventory",
            "Work Order Management",
            "Production Planning",
            "Quality Control",
            "Equipment Maintenance",
            "Time Tracking",
            "Resource Allocation",
            "Cost Analysis",
        ],
    ),
    "ngo": _d(
        name="NGO Impact",
        description="Programs, donors, grants, volunteers, and impact reporting for nonprofits.",
        plan_type="ngo",
        price=29,
        billing_cycle="monthly",
        max_projects=5,
        max_users=15,
        features=[
            "hrm",
            "inventory",
            "Donor Management",
            "Donation Receipts",
            "Volunteer Management",
            "Relief Projects",
            "Fund Accounting",
            "Charity Reports",
        ],
    ),
    "healthcare": _d(
        name="Healthcare Suite",
        description="Patients, appointments, prescriptions, admissions, and clinic billing.",
        plan_type="healthcare",
        price=59,
        billing_cycle="monthly",
        max_projects=5,
        max_users=20,
        features=[
            "hrm",
            "inventory",
            "Patient Management",
            "Appointment Scheduling",
            "Electronic Health Records (EHR)",
            "Staff Management",
            "Reporting & Analytics",
        ],
    ),
    "lms": _d(
        name="LMS Suite",
        description="A complete learning management system with courses, lectures, assignments, and grades.",
        plan_type="lms",
        price=39,
        billing_cycle="monthly",
        max_projects=5,
        max_users=20,
        features=[
            "hrm",
            "inventory",
            "Course Management",
            "Video Lectures",
            "Assignments & Grades",
            "Progress Tracking",
            "Student Enrollments",
            "Attendance Tracking",
            "Learning Reports",
        ],
    ),
}


def plan_to_dict(definition: PlanDefinition) -> Dict[str, Any]:
    """Convert a PlanDefinition into the row payload expected by seed.py."""
    return {
        "name": definition.name,
        "description": definition.description,
        "planType": definition.planType,
        "price": definition.price,
        "billingCycle": definition.billingCycle,
        "maxProjects": definition.maxProjects,
        "maxUsers": definition.maxUsers,
        "features": definition.features,
        "modules": [],
        "isActive": True,
    }
