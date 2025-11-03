from dataclasses import dataclass
from ....core.query import IQuery

@dataclass
class GetTrainingEnrollmentByIdQuery(IQuery):
    tenant_id: str
    trainingenrollment_id: str
