from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TillTransactionRepository, TillRepository
from .command import DeleteTillTransactionCommand

class DeleteTillTransactionHandler(RequestHandlerBase[DeleteTillTransactionCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteTillTransactionCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                transaction_repo = TillTransactionRepository(uow.session)
                till_repo = TillRepository(uow.session)
                
                transaction = transaction_repo.get_by_id(command.transaction_id, command.tenant_id)
                if not transaction:
                    return Result.failure("Till transaction not found")
                
                till_id = str(transaction.till_id)
                transaction_repo.delete(transaction)
                
                last_transactions = transaction_repo.get_by_till(till_id, command.tenant_id)
                till = till_repo.get_by_id(till_id, command.tenant_id)
                if last_transactions:
                    till.current_balance = last_transactions[0].running_balance
                else:
                    till.current_balance = till.initial_balance
                till.updated_at = datetime.utcnow()
                till_repo.update(till)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete till transaction: {str(e)}")

