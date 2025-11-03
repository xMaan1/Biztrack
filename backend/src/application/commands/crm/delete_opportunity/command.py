from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteOpportunityCommand(ICommand):
    tenant_id: str
    opportunity_id: str
