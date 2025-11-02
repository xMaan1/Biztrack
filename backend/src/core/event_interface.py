from abc import ABC
from datetime import datetime
from typing import Optional
import uuid

class IEvent(ABC):
    event_id: str
    occurred_on: datetime
    tenant_id: Optional[str] = None

    def __init__(self, tenant_id: Optional[str] = None):
        self.event_id = str(uuid.uuid4())
        self.occurred_on = datetime.utcnow()
        self.tenant_id = tenant_id

