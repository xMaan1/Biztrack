from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetQualityInspectionByIdQuery(IQuery):
    tenant_id: str
    qualityinspection_id: str
