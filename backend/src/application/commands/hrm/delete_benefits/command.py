from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteBenefitsCommand(ICommand):
    tenant_id: str
    benefits_id: str
