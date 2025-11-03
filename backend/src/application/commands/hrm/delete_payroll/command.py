from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeletePayrollCommand(ICommand):
    tenant_id: str
    payroll_id: str
