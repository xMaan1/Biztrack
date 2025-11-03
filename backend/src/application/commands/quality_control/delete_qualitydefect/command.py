from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteQualityDefectCommand(ICommand):
    tenant_id: str
    qualitydefect_id: str
