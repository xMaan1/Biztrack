from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PaymentRepository
from ....domain.entities.invoice_entity import Payment
from .command import CreatePaymentCommand

class CreatePaymentHandler(RequestHandlerBase[CreatePaymentCommand, Result[Payment]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreatePaymentCommand) -> Result[Payment]:
        try:
            with self._unit_of_work as uow:
                repo = PaymentRepository(uow.session)
                
                payment = Payment(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    amount=command.amount,
                    invoiceId=uuid.UUID(command.invoiceId),
                    notes=command.notes,
                    paymentDate=datetime.fromisoformat(command.paymentDate.replace('Z', '+00:00')) if command.paymentDate else datetime.utcnow(),
                    paymentMethod=command.paymentMethod,
                    reference=command.reference,
                    status=command.status,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(payment)
                uow.commit()
                return Result.success(payment)
                
        except Exception as e:
            return Result.failure(f"Failed to create payment: {str(e)}")
