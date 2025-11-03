from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetStorageLocationByIdQuery(IQuery):
    tenant_id: str
    storagelocation_id: str
