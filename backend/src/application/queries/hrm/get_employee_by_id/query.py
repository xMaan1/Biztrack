from dataclasses import dataclass
from typing import Optional
from ....core.query import IQuery

@dataclass
class GetEmployeeByIdQuery(IQuery):
    employee_id: str
    tenant_id: Optional[str] = None

