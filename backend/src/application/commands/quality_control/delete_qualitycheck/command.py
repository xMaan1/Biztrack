from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteQualityCheckCommand(ICommand):
    tenant_id: str
    qualitycheck_id: str
