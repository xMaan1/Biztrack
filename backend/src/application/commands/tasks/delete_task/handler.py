from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TaskRepository
from .command import DeleteTaskCommand

class DeleteTaskHandler(RequestHandlerBase[DeleteTaskCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteTaskCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                task_repo = TaskRepository(uow.session)
                
                success = task_repo.delete(command.task_id, command.tenant_id)
                if not success:
                    return Result.failure("Task not found")
                
                uow.commit()
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete task: {str(e)}")

