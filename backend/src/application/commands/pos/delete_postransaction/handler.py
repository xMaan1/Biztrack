from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import POSTransactionRepository
from .command import DeletePOSTransactionCommand

class DeletePOSTransactionHandler(RequestHandlerBase[DeletePOSTransactionCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeletePOSTransactionCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = POSTransactionRepository(uow.session)
                
                postransaction = repo.get_by_id(command.postransaction_id, command.tenant_id)
                if not postransaction:
                    return Result.failure("POSTransaction not found")
                
                repo.delete(postransaction)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete postransaction: {str(e)}")
