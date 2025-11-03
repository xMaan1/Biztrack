from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetNotificationByIdQuery(IQuery):
    tenant_id: str
    notification_id: str
