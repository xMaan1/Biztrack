from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteEmployeeCommand(ICommand):
    employee_id: str
    tenant_id: str

