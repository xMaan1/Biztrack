from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetEquipmentByIdQuery(IQuery):
    tenant_id: str
    equipment_id: str
