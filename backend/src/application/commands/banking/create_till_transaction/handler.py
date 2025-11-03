from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TillTransactionRepository, TillRepository
from ....domain.entities.banking_entity import TillTransaction
from ....domain.enums.banking_enums import TillTransactionType
from .command import CreateTillTransactionCommand

class CreateTillTransactionHandler(RequestHandlerBase[CreateTillTransactionCommand, Result[TillTransaction]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateTillTransactionCommand) -> Result[TillTransaction]:
        try:
            with self._unit_of_work as uow:
                transaction_repo = TillTransactionRepository(uow.session)
                till_repo = TillRepository(uow.session)
                
                till = till_repo.get_by_id(command.till_id, command.tenant_id)
                if not till:
                    return Result.failure("Till not found")
                
                last_transaction = transaction_repo.get_by_till(command.till_id, command.tenant_id)
                current_balance = till.current_balance
                if last_transaction and len(last_transaction) > 0:
                    current_balance = last_transaction[0].running_balance
                else:
                    current_balance = till.initial_balance
                
                transaction_type = TillTransactionType(command.transaction_type) if isinstance(command.transaction_type, str) else command.transaction_type
                
                if transaction_type == TillTransactionType.DEPOSIT:
                    running_balance = current_balance + command.amount
                elif transaction_type == TillTransactionType.WITHDRAWAL:
                    running_balance = current_balance - command.amount
                else:
                    running_balance = current_balance + command.amount
                
                transaction_entity = TillTransaction(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    till_id=uuid.UUID(command.till_id),
                    bank_account_id=uuid.UUID(command.bank_account_id) if command.bank_account_id else None,
                    transaction_number=command.transaction_number,
                    transaction_date=command.transaction_date,
                    transaction_type=transaction_type,
                    amount=command.amount,
                    running_balance=running_balance,
                    currency=command.currency,
                    description=command.description,
                    reason=command.reason,
                    reference_number=command.reference_number,
                    performed_by=uuid.UUID(command.performed_by) if command.performed_by else None,
                    approved_by=uuid.UUID(command.approved_by) if command.approved_by else None,
                    notes=command.notes,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                transaction_repo.add(transaction_entity)
                till.current_balance = running_balance
                till.updated_at = datetime.utcnow()
                till_repo.update(till)
                uow.commit()
                return Result.success(transaction_entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create till transaction: {str(e)}")

