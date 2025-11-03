from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionStepRepository
from ....domain.entities.production_entity import ProductionStep
from .query import GetProductionStepByIdQuery

class GetProductionStepByIdHandler(RequestHandlerBase[GetProductionStepByIdQuery, Result[Optional[ProductionStep]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetProductionStepByIdQuery) -> Result[Optional[ProductionStep]]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionStepRepository(uow.session)
                entity = repo.get_by_id(query.productionstep_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get productionstep: {str(e)}")
