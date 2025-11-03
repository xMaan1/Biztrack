from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BenefitsRepository
from ....domain.entities.hrm_entity import Benefits
from .query import GetBenefitsByIdQuery

class GetBenefitsByIdHandler(RequestHandlerBase[GetBenefitsByIdQuery, Result[Optional[Benefits]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetBenefitsByIdQuery) -> Result[Optional[Benefits]]:
        try:
            with self._unit_of_work as uow:
                repo = BenefitsRepository(uow.session)
                entity = repo.get_by_id(query.benefits_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get benefits: {str(e)}")
