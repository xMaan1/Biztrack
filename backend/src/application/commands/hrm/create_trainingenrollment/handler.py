from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TrainingEnrollmentRepository
from ....domain.entities.hrm_entity import TrainingEnrollment
from .command import CreateTrainingEnrollmentCommand

class CreateTrainingEnrollmentHandler(RequestHandlerBase[CreateTrainingEnrollmentCommand, Result[TrainingEnrollment]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateTrainingEnrollmentCommand) -> Result[TrainingEnrollment]:
        try:
            with self._unit_of_work as uow:
                repo = TrainingEnrollmentRepository(uow.session)
                
                trainingenrollment = TrainingEnrollment(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    certificate=command.certificate,
                    completionDate=datetime.fromisoformat(command.completionDate.replace('Z', '+00:00')) if command.completionDate else None,
                    createdBy=uuid.UUID(command.createdBy),
                    employeeId=uuid.UUID(command.employeeId),
                    enrollmentDate=datetime.fromisoformat(command.enrollmentDate.replace('Z', '+00:00')) if command.enrollmentDate else datetime.utcnow(),
                    feedback=command.feedback,
                    score=command.score,
                    status=command.status,
                    trainingId=uuid.UUID(command.trainingId),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(trainingenrollment)
                uow.commit()
                return Result.success(trainingenrollment)
                
        except Exception as e:
            return Result.failure(f"Failed to create trainingenrollment: {str(e)}")
