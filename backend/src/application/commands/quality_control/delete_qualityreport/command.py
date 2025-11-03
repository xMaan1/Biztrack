from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteQualityReportCommand(ICommand):
    tenant_id: str
    qualityreport_id: str
