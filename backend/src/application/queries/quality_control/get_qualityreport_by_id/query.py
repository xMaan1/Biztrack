from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetQualityReportByIdQuery(IQuery):
    tenant_id: str
    qualityreport_id: str
