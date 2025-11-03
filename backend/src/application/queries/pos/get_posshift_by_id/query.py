from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetPOSShiftByIdQuery(IQuery):
    tenant_id: str
    posshift_id: str
