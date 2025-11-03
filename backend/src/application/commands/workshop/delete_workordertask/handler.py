from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WorkOrderTaskRepository
from .command import DeleteWorkOrderTaskCommand

class DeleteWorkOrderTaskHandler(RequestHandlerBase[DeleteWorkOrderTaskCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteWorkOrderTaskCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = WorkOrderTaskRepository(uow.session)
                
                workordertask = repo.get_by_id(command.workordertask_id, command.tenant_id)
                if not workordertask:
                    return Result.failure("WorkOrderTask not found")
                
                repo.delete(workordertask)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete workordertask: {str(e)}")
