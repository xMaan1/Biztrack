from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TrainingRepository
from .command import DeleteTrainingCommand

class DeleteTrainingHandler(RequestHandlerBase[DeleteTrainingCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteTrainingCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = TrainingRepository(uow.session)
                
                training = repo.get_by_id(command.training_id, command.tenant_id)
                if not training:
                    return Result.failure("Training not found")
                
                repo.delete(training)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete training: {str(e)}")
