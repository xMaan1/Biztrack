from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ReceivingRepository
from ....domain.entities.inventory_entity import Receiving
from .command import UpdateReceivingCommand

class UpdateReceivingHandler(RequestHandlerBase[UpdateReceivingCommand, Result[Receiving]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateReceivingCommand) -> Result[Receiving]:
        try:
            with self._unit_of_work as uow:
                repo = ReceivingRepository(uow.session)
                
                receiving = repo.get_by_id(command.receiving_id, command.tenant_id)
                if not receiving:
                    return Result.failure("Receiving not found")
                
                                if command.items is not None:
                    receiving.items = command.items or []
                if command.notes is not None:
                    receiving.notes = command.notes
                if command.purchaseOrderId is not None:
                    receiving.purchaseOrderId = uuid.UUID(command.purchaseOrderId) if command.purchaseOrderId else None
                if command.receivedBy is not None:
                    receiving.receivedBy = uuid.UUID(command.receivedBy) if command.receivedBy else None
                if command.receivedDate is not None:
                    receiving.receivedDate = datetime.fromisoformat(command.receivedDate.replace('Z', '+00:00')) if command.receivedDate else None
                if command.receivingNumber is not None:
                    receiving.receivingNumber = command.receivingNumber
                if command.status is not None:
                    receiving.status = command.status
                if command.warehouseId is not None:
                    receiving.warehouseId = uuid.UUID(command.warehouseId) if command.warehouseId else None
                
                receiving.updatedAt = datetime.utcnow()
                repo.update(receiving)
                uow.commit()
                
                return Result.success(receiving)
                
        except Exception as e:
            return Result.failure(f"Failed to update receiving: {str(e)}")
