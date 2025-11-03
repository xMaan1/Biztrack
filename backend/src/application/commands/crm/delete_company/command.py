from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteCompanyCommand(ICommand):
    tenant_id: str
    company_id: str
