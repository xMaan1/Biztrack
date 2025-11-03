from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import POSTransactionRepository
from ....domain.entities.pos_entity import POSTransaction
from .command import CreatePOSTransactionCommand

class CreatePOSTransactionHandler(RequestHandlerBase[CreatePOSTransactionCommand, Result[POSTransaction]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreatePOSTransactionCommand) -> Result[POSTransaction]:
        try:
            with self._unit_of_work as uow:
                repo = POSTransactionRepository(uow.session)
                
                postransaction = POSTransaction(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    customerId=command.customerId,
                    customerName=command.customerName,
                    discount=command.discount,
                    items=command.items or [],
                    notes=command.notes,
                    paymentMethod=command.paymentMethod,
                    paymentStatus=command.paymentStatus,
                    shiftId=uuid.UUID(command.shiftId),
                    subtotal=command.subtotal,
                    taxAmount=command.taxAmount,
                    total=command.total,
                    transactionNumber=command.transactionNumber,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(postransaction)
                uow.commit()
                return Result.success(postransaction)
                
        except Exception as e:
            return Result.failure(f"Failed to create postransaction: {str(e)}")
