from dataclasses import dataclass
from typing import Optional
from ....core.command import ICommand

@dataclass
class DeleteProjectCommand(ICommand):
    project_id: str
    tenant_id: Optional[str] = None

