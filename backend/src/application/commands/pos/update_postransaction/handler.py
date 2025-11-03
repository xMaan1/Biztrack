from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import POSTransactionRepository
from ....domain.entities.pos_entity import POSTransaction
from .command import UpdatePOSTransactionCommand

class UpdatePOSTransactionHandler(RequestHandlerBase[UpdatePOSTransactionCommand, Result[POSTransaction]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdatePOSTransactionCommand) -> Result[POSTransaction]:
        try:
            with self._unit_of_work as uow:
                repo = POSTransactionRepository(uow.session)
                
                postransaction = repo.get_by_id(command.postransaction_id, command.tenant_id)
                if not postransaction:
                    return Result.failure("POSTransaction not found")
                
                                if command.customerId is not None:
                    postransaction.customerId = command.customerId
                if command.customerName is not None:
                    postransaction.customerName = command.customerName
                if command.discount is not None:
                    postransaction.discount = command.discount
                if command.items is not None:
                    postransaction.items = command.items or []
                if command.notes is not None:
                    postransaction.notes = command.notes
                if command.paymentMethod is not None:
                    postransaction.paymentMethod = command.paymentMethod
                if command.paymentStatus is not None:
                    postransaction.paymentStatus = command.paymentStatus
                if command.shiftId is not None:
                    postransaction.shiftId = uuid.UUID(command.shiftId) if command.shiftId else None
                if command.subtotal is not None:
                    postransaction.subtotal = command.subtotal
                if command.taxAmount is not None:
                    postransaction.taxAmount = command.taxAmount
                if command.total is not None:
                    postransaction.total = command.total
                if command.transactionNumber is not None:
                    postransaction.transactionNumber = command.transactionNumber
                
                postransaction.updatedAt = datetime.utcnow()
                repo.update(postransaction)
                uow.commit()
                
                return Result.success(postransaction)
                
        except Exception as e:
            return Result.failure(f"Failed to update postransaction: {str(e)}")
