from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import AccountReceivableRepository
from ....domain.entities.ledger_entity import AccountReceivable
from .command import UpdateAccountReceivableCommand

class UpdateAccountReceivableHandler(RequestHandlerBase[UpdateAccountReceivableCommand, Result[AccountReceivable]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateAccountReceivableCommand) -> Result[AccountReceivable]:
        try:
            with self._unit_of_work as uow:
                repo = AccountReceivableRepository(uow.session)
                
                accountreceivable = repo.get_by_id(command.accountreceivable_id, command.tenant_id)
                if not accountreceivable:
                    return Result.failure("AccountReceivable not found")
                
                                if command.amount_paid is not None:
                    accountreceivable.amount_paid = command.amount_paid
                if command.created_by is not None:
                    accountreceivable.created_by = uuid.UUID(command.created_by) if command.created_by else None
                if command.currency is not None:
                    accountreceivable.currency = command.currency
                if command.customer_email is not None:
                    accountreceivable.customer_email = command.customer_email.lower() if command.customer_email else None
                if command.customer_id is not None:
                    accountreceivable.customer_id = command.customer_id
                if command.customer_name is not None:
                    accountreceivable.customer_name = command.customer_name
                if command.customer_phone is not None:
                    accountreceivable.customer_phone = command.customer_phone
                if command.days_overdue is not None:
                    accountreceivable.days_overdue = command.days_overdue
                if command.due_date is not None:
                    accountreceivable.due_date = datetime.fromisoformat(command.due_date.replace('Z', '+00:00')) if command.due_date else None
                if command.invoice_amount is not None:
                    accountreceivable.invoice_amount = command.invoice_amount
                if command.invoice_date is not None:
                    accountreceivable.invoice_date = datetime.fromisoformat(command.invoice_date.replace('Z', '+00:00')) if command.invoice_date else None
                if command.invoice_id is not None:
                    accountreceivable.invoice_id = command.invoice_id
                if command.invoice_number is not None:
                    accountreceivable.invoice_number = command.invoice_number
                if command.notes is not None:
                    accountreceivable.notes = command.notes
                if command.outstanding_balance is not None:
                    accountreceivable.outstanding_balance = command.outstanding_balance
                if command.payment_terms is not None:
                    accountreceivable.payment_terms = command.payment_terms
                if command.status is not None:
                    accountreceivable.status = command.status
                
                accountreceivable.updatedAt = datetime.utcnow()
                repo.update(accountreceivable)
                uow.commit()
                
                return Result.success(accountreceivable)
                
        except Exception as e:
            return Result.failure(f"Failed to update accountreceivable: {str(e)}")
