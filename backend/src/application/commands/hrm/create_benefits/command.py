from dataclasses import dataclass
from typing import Optional, List
from ....core.command import ICommand

@dataclass
class CreateBenefitsCommand(ICommand):
    tenant_id: str
    cost: float
    description: str
    employeeContribution: Optional[float] = 0.0
    employerContribution: Optional[float] = 0.0
    isActive: Optional[bool] = False
    name: str
    type: str
    created_by: Optional[str] = None
