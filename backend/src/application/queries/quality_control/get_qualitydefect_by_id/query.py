from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetQualityDefectByIdQuery(IQuery):
    tenant_id: str
    qualitydefect_id: str
