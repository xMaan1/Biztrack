from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ReceivingRepository
from ....domain.entities.inventory_entity import Receiving
from .command import CreateReceivingCommand

class CreateReceivingHandler(RequestHandlerBase[CreateReceivingCommand, Result[Receiving]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateReceivingCommand) -> Result[Receiving]:
        try:
            with self._unit_of_work as uow:
                repo = ReceivingRepository(uow.session)
                
                receiving = Receiving(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    items=command.items or [],
                    notes=command.notes,
                    purchaseOrderId=uuid.UUID(command.purchaseOrderId),
                    receivedBy=uuid.UUID(command.receivedBy),
                    receivedDate=datetime.fromisoformat(command.receivedDate.replace('Z', '+00:00')) if command.receivedDate else datetime.utcnow(),
                    receivingNumber=command.receivingNumber,
                    status=command.status,
                    warehouseId=uuid.UUID(command.warehouseId),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(receiving)
                uow.commit()
                return Result.success(receiving)
                
        except Exception as e:
            return Result.failure(f"Failed to create receiving: {str(e)}")
