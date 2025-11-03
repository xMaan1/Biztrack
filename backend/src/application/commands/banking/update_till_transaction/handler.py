from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TillTransactionRepository, TillRepository
from ....domain.entities.banking_entity import TillTransaction
from ....domain.enums.banking_enums import TillTransactionType
from .command import UpdateTillTransactionCommand

class UpdateTillTransactionHandler(RequestHandlerBase[UpdateTillTransactionCommand, Result[TillTransaction]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateTillTransactionCommand) -> Result[TillTransaction]:
        try:
            with self._unit_of_work as uow:
                transaction_repo = TillTransactionRepository(uow.session)
                till_repo = TillRepository(uow.session)
                
                transaction = transaction_repo.get_by_id(command.transaction_id, command.tenant_id)
                if not transaction:
                    return Result.failure("Till transaction not found")
                
                till_id = command.till_id or str(transaction.till_id)
                till = till_repo.get_by_id(till_id, command.tenant_id)
                if not till:
                    return Result.failure("Till not found")
                
                if command.till_id is not None:
                    transaction.till_id = uuid.UUID(command.till_id)
                if command.transaction_date is not None:
                    transaction.transaction_date = command.transaction_date
                if command.transaction_type is not None:
                    transaction.transaction_type = TillTransactionType(command.transaction_type) if isinstance(command.transaction_type, str) else command.transaction_type
                if command.amount is not None:
                    transaction.amount = command.amount
                if command.currency is not None:
                    transaction.currency = command.currency
                if command.description is not None:
                    transaction.description = command.description
                if command.reason is not None:
                    transaction.reason = command.reason
                if command.reference_number is not None:
                    transaction.reference_number = command.reference_number
                if command.bank_account_id is not None:
                    transaction.bank_account_id = uuid.UUID(command.bank_account_id) if command.bank_account_id else None
                if command.approved_by is not None:
                    transaction.approved_by = uuid.UUID(command.approved_by) if command.approved_by else None
                if command.notes is not None:
                    transaction.notes = command.notes
                
                last_transactions = transaction_repo.get_by_till(str(transaction.till_id), command.tenant_id)
                if last_transactions:
                    current_balance = last_transactions[0].running_balance
                else:
                    current_balance = till.initial_balance
                
                transaction_type = transaction.transaction_type
                amount = transaction.amount
                
                if transaction_type == TillTransactionType.DEPOSIT:
                    running_balance = current_balance + amount
                elif transaction_type == TillTransactionType.WITHDRAWAL:
                    running_balance = current_balance - amount
                else:
                    running_balance = current_balance + amount
                
                transaction.running_balance = running_balance
                transaction.updated_at = datetime.utcnow()
                transaction_repo.update(transaction)
                
                till.current_balance = running_balance
                till.updated_at = datetime.utcnow()
                till_repo.update(till)
                uow.commit()
                
                return Result.success(transaction)
                
        except Exception as e:
            return Result.failure(f"Failed to update till transaction: {str(e)}")

