from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import StorageLocationRepository
from ....domain.entities.inventory_entity import StorageLocation
from .command import UpdateStorageLocationCommand

class UpdateStorageLocationHandler(RequestHandlerBase[UpdateStorageLocationCommand, Result[StorageLocation]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateStorageLocationCommand) -> Result[StorageLocation]:
        try:
            with self._unit_of_work as uow:
                repo = StorageLocationRepository(uow.session)
                
                storagelocation = repo.get_by_id(command.storagelocation_id, command.tenant_id)
                if not storagelocation:
                    return Result.failure("StorageLocation not found")
                
                                if command.capacity is not None:
                    storagelocation.capacity = command.capacity
                if command.code is not None:
                    storagelocation.code = command.code
                if command.createdBy is not None:
                    storagelocation.createdBy = uuid.UUID(command.createdBy) if command.createdBy else None
                if command.description is not None:
                    storagelocation.description = command.description
                if command.isActive is not None:
                    storagelocation.isActive = command.isActive
                if command.locationType is not None:
                    storagelocation.locationType = command.locationType
                if command.name is not None:
                    storagelocation.name = command.name
                if command.parentLocationId is not None:
                    storagelocation.parentLocationId = uuid.UUID(command.parentLocationId) if command.parentLocationId else None
                if command.usedCapacity is not None:
                    storagelocation.usedCapacity = command.usedCapacity
                if command.warehouseId is not None:
                    storagelocation.warehouseId = uuid.UUID(command.warehouseId) if command.warehouseId else None
                
                storagelocation.updatedAt = datetime.utcnow()
                repo.update(storagelocation)
                uow.commit()
                
                return Result.success(storagelocation)
                
        except Exception as e:
            return Result.failure(f"Failed to update storagelocation: {str(e)}")
