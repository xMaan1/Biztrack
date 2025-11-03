from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeletePerformanceReviewCommand(ICommand):
    tenant_id: str
    performancereview_id: str
