from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateCompanyCommand(ICommand):
    tenant_id: str
    company_id: str
    address: Optional[str] = None
    annualRevenue: Optional[float] = None
    city: Optional[str] = None
    country: Optional[str] = None
    employeeCount: Optional[int] = None
    industry: Optional[str] = None
    isActive: Optional[bool] = None
    name: Optional[str] = None
    notes: Optional[str] = None
    phone: Optional[str] = None
    postalCode: Optional[str] = None
    state: Optional[str] = None
    website: Optional[str] = None
