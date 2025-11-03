from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LedgerTransactionRepository
from ....domain.entities.ledger_entity import LedgerTransaction
from .command import UpdateLedgerTransactionCommand

class UpdateLedgerTransactionHandler(RequestHandlerBase[UpdateLedgerTransactionCommand, Result[LedgerTransaction]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateLedgerTransactionCommand) -> Result[LedgerTransaction]:
        try:
            with self._unit_of_work as uow:
                repo = LedgerTransactionRepository(uow.session)
                
                ledgertransaction = repo.get_by_id(command.ledgertransaction_id, command.tenant_id)
                if not ledgertransaction:
                    return Result.failure("LedgerTransaction not found")
                
                                if command.amount is not None:
                    ledgertransaction.amount = command.amount
                if command.approved_by is not None:
                    ledgertransaction.approved_by = uuid.UUID(command.approved_by) if command.approved_by else None
                if command.attachments is not None:
                    ledgertransaction.attachments = command.attachments or []
                if command.created_by is not None:
                    ledgertransaction.created_by = uuid.UUID(command.created_by) if command.created_by else None
                if command.credit_account_id is not None:
                    ledgertransaction.credit_account_id = uuid.UUID(command.credit_account_id) if command.credit_account_id else None
                if command.currency is not None:
                    ledgertransaction.currency = command.currency
                if command.debit_account_id is not None:
                    ledgertransaction.debit_account_id = uuid.UUID(command.debit_account_id) if command.debit_account_id else None
                if command.description is not None:
                    ledgertransaction.description = command.description
                if command.journal_entry_id is not None:
                    ledgertransaction.journal_entry_id = uuid.UUID(command.journal_entry_id) if command.journal_entry_id else None
                if command.notes is not None:
                    ledgertransaction.notes = command.notes
                if command.reference_id is not None:
                    ledgertransaction.reference_id = command.reference_id
                if command.reference_number is not None:
                    ledgertransaction.reference_number = command.reference_number
                if command.reference_type is not None:
                    ledgertransaction.reference_type = command.reference_type
                if command.status is not None:
                    ledgertransaction.status = command.status
                if command.tags is not None:
                    ledgertransaction.tags = command.tags or []
                if command.transaction_date is not None:
                    ledgertransaction.transaction_date = datetime.fromisoformat(command.transaction_date.replace('Z', '+00:00')) if command.transaction_date else None
                if command.transaction_number is not None:
                    ledgertransaction.transaction_number = command.transaction_number
                if command.transaction_type is not None:
                    ledgertransaction.transaction_type = command.transaction_type
                
                ledgertransaction.updatedAt = datetime.utcnow()
                repo.update(ledgertransaction)
                uow.commit()
                
                return Result.success(ledgertransaction)
                
        except Exception as e:
            return Result.failure(f"Failed to update ledgertransaction: {str(e)}")
