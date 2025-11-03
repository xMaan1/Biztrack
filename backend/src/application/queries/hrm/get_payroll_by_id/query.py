from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetPayrollByIdQuery(IQuery):
    tenant_id: str
    payroll_id: str
