from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteTrainingCommand(ICommand):
    tenant_id: str
    training_id: str
