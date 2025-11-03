from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import StockMovementRepository
from ....domain.entities.inventory_entity import StockMovement
from .command import CreateStockMovementCommand

class CreateStockMovementHandler(RequestHandlerBase[CreateStockMovementCommand, Result[StockMovement]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateStockMovementCommand) -> Result[StockMovement]:
        try:
            with self._unit_of_work as uow:
                repo = StockMovementRepository(uow.session)
                
                stockmovement = StockMovement(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    batchNumber=command.batchNumber,
                    createdBy=uuid.UUID(command.createdBy),
                    expiryDate=datetime.fromisoformat(command.expiryDate.replace('Z', '+00:00')) if command.expiryDate else None,
                    locationId=command.locationId,
                    movementType=command.movementType,
                    notes=command.notes,
                    productId=command.productId,
                    quantity=command.quantity,
                    referenceNumber=command.referenceNumber,
                    referenceType=command.referenceType,
                    serialNumber=command.serialNumber,
                    status=command.status,
                    unitCost=command.unitCost,
                    warehouseId=uuid.UUID(command.warehouseId),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(stockmovement)
                uow.commit()
                return Result.success(stockmovement)
                
        except Exception as e:
            return Result.failure(f"Failed to create stockmovement: {str(e)}")
