from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetEquipmentInvestmentByIdQuery(IQuery):
    tenant_id: str
    equipmentinvestment_id: str
