from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class UpdateBenefitsCommand(ICommand):
    tenant_id: str
    benefits_id: str
    cost: Optional[float] = None
    description: Optional[str] = None
    employeeContribution: Optional[float] = None
    employerContribution: Optional[float] = None
    isActive: Optional[bool] = None
    name: Optional[str] = None
    type: Optional[str] = None
