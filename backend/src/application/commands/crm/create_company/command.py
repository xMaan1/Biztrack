from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateCompanyCommand(ICommand):
    tenant_id: str
    address: str
    annualRevenue: float
    city: str
    country: str
    employeeCount: int
    industry: str
    isActive: Optional[bool] = False
    name: str
    notes: str
    phone: str
    postalCode: str
    state: str
    website: str
    created_by: Optional[str] = None
