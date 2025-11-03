from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionPlanRepository
from ....domain.entities.production_entity import ProductionPlan
from .query import GetProductionPlanByIdQuery

class GetProductionPlanByIdHandler(RequestHandlerBase[GetProductionPlanByIdQuery, Result[Optional[ProductionPlan]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetProductionPlanByIdQuery) -> Result[Optional[ProductionPlan]]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionPlanRepository(uow.session)
                entity = repo.get_by_id(query.productionplan_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get productionplan: {str(e)}")
