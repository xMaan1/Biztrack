from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import StorageLocationRepository
from ....domain.entities.inventory_entity import StorageLocation
from .command import CreateStorageLocationCommand

class CreateStorageLocationHandler(RequestHandlerBase[CreateStorageLocationCommand, Result[StorageLocation]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateStorageLocationCommand) -> Result[StorageLocation]:
        try:
            with self._unit_of_work as uow:
                repo = StorageLocationRepository(uow.session)
                
                storagelocation = StorageLocation(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    capacity=command.capacity,
                    code=command.code,
                    createdBy=uuid.UUID(command.createdBy),
                    description=command.description,
                    isActive=command.isActive,
                    locationType=command.locationType,
                    name=command.name,
                    parentLocationId=uuid.UUID(command.parentLocationId),
                    usedCapacity=command.usedCapacity,
                    warehouseId=uuid.UUID(command.warehouseId),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(storagelocation)
                uow.commit()
                return Result.success(storagelocation)
                
        except Exception as e:
            return Result.failure(f"Failed to create storagelocation: {str(e)}")
