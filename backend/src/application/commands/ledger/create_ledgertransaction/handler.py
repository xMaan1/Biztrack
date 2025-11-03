from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LedgerTransactionRepository
from ....domain.entities.ledger_entity import LedgerTransaction
from .command import CreateLedgerTransactionCommand

class CreateLedgerTransactionHandler(RequestHandlerBase[CreateLedgerTransactionCommand, Result[LedgerTransaction]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateLedgerTransactionCommand) -> Result[LedgerTransaction]:
        try:
            with self._unit_of_work as uow:
                repo = LedgerTransactionRepository(uow.session)
                
                ledgertransaction = LedgerTransaction(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    amount=command.amount,
                    approved_by=uuid.UUID(command.approved_by),
                    attachments=command.attachments or [],
                    created_by=uuid.UUID(command.created_by),
                    credit_account_id=uuid.UUID(command.credit_account_id),
                    currency=command.currency,
                    debit_account_id=uuid.UUID(command.debit_account_id),
                    description=command.description,
                    journal_entry_id=uuid.UUID(command.journal_entry_id),
                    notes=command.notes,
                    reference_id=command.reference_id,
                    reference_number=command.reference_number,
                    reference_type=command.reference_type,
                    status=command.status,
                    tags=command.tags or [],
                    transaction_date=datetime.fromisoformat(command.transaction_date.replace('Z', '+00:00')) if command.transaction_date else datetime.utcnow(),
                    transaction_number=command.transaction_number,
                    transaction_type=command.transaction_type,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(ledgertransaction)
                uow.commit()
                return Result.success(ledgertransaction)
                
        except Exception as e:
            return Result.failure(f"Failed to create ledgertransaction: {str(e)}")
