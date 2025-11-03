from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetQualityCheckByIdQuery(IQuery):
    tenant_id: str
    qualitycheck_id: str
