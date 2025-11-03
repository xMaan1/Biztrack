from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TrainingEnrollmentRepository
from .command import DeleteTrainingEnrollmentCommand

class DeleteTrainingEnrollmentHandler(RequestHandlerBase[DeleteTrainingEnrollmentCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteTrainingEnrollmentCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = TrainingEnrollmentRepository(uow.session)
                
                trainingenrollment = repo.get_by_id(command.trainingenrollment_id, command.tenant_id)
                if not trainingenrollment:
                    return Result.failure("TrainingEnrollment not found")
                
                repo.delete(trainingenrollment)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete trainingenrollment: {str(e)}")
