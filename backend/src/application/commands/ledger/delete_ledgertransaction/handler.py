from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LedgerTransactionRepository
from .command import DeleteLedgerTransactionCommand

class DeleteLedgerTransactionHandler(RequestHandlerBase[DeleteLedgerTransactionCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteLedgerTransactionCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = LedgerTransactionRepository(uow.session)
                
                ledgertransaction = repo.get_by_id(command.ledgertransaction_id, command.tenant_id)
                if not ledgertransaction:
                    return Result.failure("LedgerTransaction not found")
                
                repo.delete(ledgertransaction)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete ledgertransaction: {str(e)}")
