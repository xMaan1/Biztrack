from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WorkOrderRepository
from .command import DeleteWorkOrderCommand

class DeleteWorkOrderHandler(RequestHandlerBase[DeleteWorkOrderCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteWorkOrderCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = WorkOrderRepository(uow.session)
                
                workorder = repo.get_by_id(command.workorder_id, command.tenant_id)
                if not workorder:
                    return Result.failure("WorkOrder not found")
                
                repo.delete(workorder)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete workorder: {str(e)}")
