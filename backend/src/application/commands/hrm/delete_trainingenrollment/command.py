from dataclasses import dataclass
from ....core.command import ICommand

@dataclass
class DeleteTrainingEnrollmentCommand(ICommand):
    tenant_id: str
    trainingenrollment_id: str
