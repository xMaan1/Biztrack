from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ReceivingRepository
from .command import DeleteReceivingCommand

class DeleteReceivingHandler(RequestHandlerBase[DeleteReceivingCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteReceivingCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = ReceivingRepository(uow.session)
                
                receiving = repo.get_by_id(command.receiving_id, command.tenant_id)
                if not receiving:
                    return Result.failure("Receiving not found")
                
                repo.delete(receiving)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete receiving: {str(e)}")
