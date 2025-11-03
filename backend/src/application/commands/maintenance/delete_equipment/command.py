from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteEquipmentCommand(ICommand):
    tenant_id: str
    equipment_id: str
