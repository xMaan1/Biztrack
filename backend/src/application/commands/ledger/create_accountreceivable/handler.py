from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import AccountReceivableRepository
from ....domain.entities.ledger_entity import AccountReceivable
from .command import CreateAccountReceivableCommand

class CreateAccountReceivableHandler(RequestHandlerBase[CreateAccountReceivableCommand, Result[AccountReceivable]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateAccountReceivableCommand) -> Result[AccountReceivable]:
        try:
            with self._unit_of_work as uow:
                repo = AccountReceivableRepository(uow.session)
                
                accountreceivable = AccountReceivable(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    amount_paid=command.amount_paid,
                    created_by=uuid.UUID(command.created_by),
                    currency=command.currency,
                    customer_email=command.customer_email.lower() if command.customer_email else None,
                    customer_id=command.customer_id,
                    customer_name=command.customer_name,
                    customer_phone=command.customer_phone,
                    days_overdue=command.days_overdue,
                    due_date=datetime.fromisoformat(command.due_date.replace('Z', '+00:00')) if command.due_date else datetime.utcnow(),
                    invoice_amount=command.invoice_amount,
                    invoice_date=datetime.fromisoformat(command.invoice_date.replace('Z', '+00:00')) if command.invoice_date else datetime.utcnow(),
                    invoice_id=command.invoice_id,
                    invoice_number=command.invoice_number,
                    notes=command.notes,
                    outstanding_balance=command.outstanding_balance,
                    payment_terms=command.payment_terms,
                    status=command.status,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(accountreceivable)
                uow.commit()
                return Result.success(accountreceivable)
                
        except Exception as e:
            return Result.failure(f"Failed to create accountreceivable: {str(e)}")
