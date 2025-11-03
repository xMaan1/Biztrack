from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import StockMovementRepository
from ....domain.entities.inventory_entity import StockMovement
from .command import UpdateStockMovementCommand

class UpdateStockMovementHandler(RequestHandlerBase[UpdateStockMovementCommand, Result[StockMovement]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateStockMovementCommand) -> Result[StockMovement]:
        try:
            with self._unit_of_work as uow:
                repo = StockMovementRepository(uow.session)
                
                stockmovement = repo.get_by_id(command.stockmovement_id, command.tenant_id)
                if not stockmovement:
                    return Result.failure("StockMovement not found")
                
                                if command.batchNumber is not None:
                    stockmovement.batchNumber = command.batchNumber
                if command.createdBy is not None:
                    stockmovement.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.expiryDate is not None:
                    stockmovement.expiryDate = datetime.fromisoformat(command.expiryDate.replace('Z', '+00:00')) if command.expiryDate else None
                if command.locationId is not None:
                    stockmovement.locationId = command.locationId
                if command.movementType is not None:
                    stockmovement.movementType = command.movementType
                if command.notes is not None:
                    stockmovement.notes = command.notes
                if command.productId is not None:
                    stockmovement.productId = command.productId
                if command.quantity is not None:
                    stockmovement.quantity = command.quantity
                if command.referenceNumber is not None:
                    stockmovement.referenceNumber = command.referenceNumber
                if command.referenceType is not None:
                    stockmovement.referenceType = command.referenceType
                if command.serialNumber is not None:
                    stockmovement.serialNumber = command.serialNumber
                if command.status is not None:
                    stockmovement.status = command.status
                if command.unitCost is not None:
                    stockmovement.unitCost = command.unitCost
                if command.warehouseId is not None:
                    stockmovement.warehouseId = uuid.UUID(command.warehouseId) if command.warehouseId else None
                
                stockmovement.updatedAt = datetime.utcnow()
                repo.update(stockmovement)
                uow.commit()
                
                return Result.success(stockmovement)
                
        except Exception as e:
            return Result.failure(f"Failed to update stockmovement: {str(e)}")
