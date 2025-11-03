from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WarehouseRepository
from ....domain.entities.inventory_entity import Warehouse
from .query import GetWarehouseByIdQuery

class GetWarehouseByIdHandler(RequestHandlerBase[GetWarehouseByIdQuery, Result[Optional[Warehouse]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetWarehouseByIdQuery) -> Result[Optional[Warehouse]]:
        try:
            with self._unit_of_work as uow:
                repo = WarehouseRepository(uow.session)
                entity = repo.get_by_id(query.warehouse_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get warehouse: {str(e)}")

