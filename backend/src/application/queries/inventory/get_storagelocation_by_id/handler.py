from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import StorageLocationRepository
from ....domain.entities.inventory_entity import StorageLocation
from .query import GetStorageLocationByIdQuery

class GetStorageLocationByIdHandler(RequestHandlerBase[GetStorageLocationByIdQuery, Result[Optional[StorageLocation]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetStorageLocationByIdQuery) -> Result[Optional[StorageLocation]]:
        try:
            with self._unit_of_work as uow:
                repo = StorageLocationRepository(uow.session)
                entity = repo.get_by_id(query.storagelocation_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get storagelocation: {str(e)}")
