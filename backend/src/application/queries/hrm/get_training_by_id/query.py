from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetTrainingByIdQuery(IQuery):
    tenant_id: str
    training_id: str
