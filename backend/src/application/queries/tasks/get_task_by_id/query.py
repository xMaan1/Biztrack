from dataclasses import dataclass
from typing import Optional
from ....core.query import IQuery

@dataclass
class GetTaskByIdQuery(IQuery):
    task_id: str
    tenant_id: Optional[str] = None

