from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BankTransactionRepository
from .command import DeleteBankTransactionCommand

class DeleteBankTransactionHandler(RequestHandlerBase[DeleteBankTransactionCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteBankTransactionCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                transaction_repo = BankTransactionRepository(uow.session)
                
                transaction = transaction_repo.get_by_id(command.transaction_id, command.tenant_id)
                if not transaction:
                    return Result.failure("Bank transaction not found")
                
                transaction_repo.delete(transaction)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete bank transaction: {str(e)}")

