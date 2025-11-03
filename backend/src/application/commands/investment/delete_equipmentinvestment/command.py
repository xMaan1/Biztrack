from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteEquipmentInvestmentCommand(ICommand):
    tenant_id: str
    equipmentinvestment_id: str
