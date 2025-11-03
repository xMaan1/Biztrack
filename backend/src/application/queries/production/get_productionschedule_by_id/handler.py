from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionScheduleRepository
from ....domain.entities.production_entity import ProductionSchedule
from .query import GetProductionScheduleByIdQuery

class GetProductionScheduleByIdHandler(RequestHandlerBase[GetProductionScheduleByIdQuery, Result[Optional[ProductionSchedule]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetProductionScheduleByIdQuery) -> Result[Optional[ProductionSchedule]]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionScheduleRepository(uow.session)
                entity = repo.get_by_id(query.productionschedule_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get productionschedule: {str(e)}")
