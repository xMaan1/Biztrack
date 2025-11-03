from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteQualityInspectionCommand(ICommand):
    tenant_id: str
    qualityinspection_id: str
