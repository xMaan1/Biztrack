from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EquipmentRepository
from ....domain.entities.maintenance_entity import Equipment
from .query import GetEquipmentByIdQuery

class GetEquipmentByIdHandler(RequestHandlerBase[GetEquipmentByIdQuery, Result[Optional[Equipment]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetEquipmentByIdQuery) -> Result[Optional[Equipment]]:
        try:
            with self._unit_of_work as uow:
                repo = EquipmentRepository(uow.session)
                entity = repo.get_by_id(query.equipment_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get equipment: {str(e)}")
