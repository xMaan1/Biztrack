from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PaymentRepository
from ....domain.entities.invoice_entity import Payment
from .command import UpdatePaymentCommand

class UpdatePaymentHandler(RequestHandlerBase[UpdatePaymentCommand, Result[Payment]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdatePaymentCommand) -> Result[Payment]:
        try:
            with self._unit_of_work as uow:
                repo = PaymentRepository(uow.session)
                
                payment = repo.get_by_id(command.payment_id, command.tenant_id)
                if not payment:
                    return Result.failure("Payment not found")
                
                                if command.amount is not None:
                    payment.amount = command.amount
                if command.invoiceId is not None:
                    payment.invoiceId = uuid.UUID(command.invoiceId) if command.invoiceId else None
                if command.notes is not None:
                    payment.notes = command.notes
                if command.paymentDate is not None:
                    payment.paymentDate = datetime.fromisoformat(command.paymentDate.replace('Z', '+00:00')) if command.paymentDate else None
                if command.paymentMethod is not None:
                    payment.paymentMethod = command.paymentMethod
                if command.reference is not None:
                    payment.reference = command.reference
                if command.status is not None:
                    payment.status = command.status
                
                payment.updatedAt = datetime.utcnow()
                repo.update(payment)
                uow.commit()
                
                return Result.success(payment)
                
        except Exception as e:
            return Result.failure(f"Failed to update payment: {str(e)}")
