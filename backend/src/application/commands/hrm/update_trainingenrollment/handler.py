from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TrainingEnrollmentRepository
from ....domain.entities.hrm_entity import TrainingEnrollment
from .command import UpdateTrainingEnrollmentCommand

class UpdateTrainingEnrollmentHandler(RequestHandlerBase[UpdateTrainingEnrollmentCommand, Result[TrainingEnrollment]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateTrainingEnrollmentCommand) -> Result[TrainingEnrollment]:
        try:
            with self._unit_of_work as uow:
                repo = TrainingEnrollmentRepository(uow.session)
                
                trainingenrollment = repo.get_by_id(command.trainingenrollment_id, command.tenant_id)
                if not trainingenrollment:
                    return Result.failure("TrainingEnrollment not found")
                
                                if command.certificate is not None:
                    trainingenrollment.certificate = command.certificate
                if command.completionDate is not None:
                    trainingenrollment.completionDate = datetime.fromisoformat(command.completionDate.replace('Z', '+00:00')) if command.completionDate else None
                if command.createdBy is not None:
                    trainingenrollment.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.employeeId is not None:
                    trainingenrollment.employeeId = uuid.UUID(command.employeeId) if command.employeeId else None
                if command.enrollmentDate is not None:
                    trainingenrollment.enrollmentDate = datetime.fromisoformat(command.enrollmentDate.replace('Z', '+00:00')) if command.enrollmentDate else None
                if command.feedback is not None:
                    trainingenrollment.feedback = command.feedback
                if command.score is not None:
                    trainingenrollment.score = command.score
                if command.status is not None:
                    trainingenrollment.status = command.status
                if command.trainingId is not None:
                    trainingenrollment.trainingId = uuid.UUID(command.trainingId) if command.trainingId else None
                
                trainingenrollment.updatedAt = datetime.utcnow()
                repo.update(trainingenrollment)
                uow.commit()
                
                return Result.success(trainingenrollment)
                
        except Exception as e:
            return Result.failure(f"Failed to update trainingenrollment: {str(e)}")
