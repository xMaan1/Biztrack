from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteProductionStepCommand(ICommand):
    tenant_id: str
    productionstep_id: str
