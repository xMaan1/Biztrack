from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteProductionPlanCommand(ICommand):
    tenant_id: str
    productionplan_id: str
