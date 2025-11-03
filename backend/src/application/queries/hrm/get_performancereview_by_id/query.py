from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetPerformanceReviewByIdQuery(IQuery):
    tenant_id: str
    performancereview_id: str
