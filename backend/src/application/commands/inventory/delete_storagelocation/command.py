from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteStorageLocationCommand(ICommand):
    tenant_id: str
    storagelocation_id: str
