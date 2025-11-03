from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import AccountReceivableRepository
from .command import DeleteAccountReceivableCommand

class DeleteAccountReceivableHandler(RequestHandlerBase[DeleteAccountReceivableCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteAccountReceivableCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = AccountReceivableRepository(uow.session)
                
                accountreceivable = repo.get_by_id(command.accountreceivable_id, command.tenant_id)
                if not accountreceivable:
                    return Result.failure("AccountReceivable not found")
                
                repo.delete(accountreceivable)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete accountreceivable: {str(e)}")
