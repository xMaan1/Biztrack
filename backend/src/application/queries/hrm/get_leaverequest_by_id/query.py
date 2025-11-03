from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetLeaveRequestByIdQuery(IQuery):
    tenant_id: str
    leaverequest_id: str
