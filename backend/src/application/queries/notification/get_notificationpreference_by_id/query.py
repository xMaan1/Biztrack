from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetNotificationPreferenceByIdQuery(IQuery):
    tenant_id: str
    notificationpreference_id: str
