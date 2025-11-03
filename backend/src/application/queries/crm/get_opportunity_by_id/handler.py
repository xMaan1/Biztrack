from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import OpportunityRepository
from ....domain.entities.crm_entity import Opportunity
from .query import GetOpportunityByIdQuery

class GetOpportunityByIdHandler(RequestHandlerBase[GetOpportunityByIdQuery, Result[Optional[Opportunity]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetOpportunityByIdQuery) -> Result[Optional[Opportunity]]:
        try:
            with self._unit_of_work as uow:
                repo = OpportunityRepository(uow.session)
                entity = repo.get_by_id(query.opportunity_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get opportunity: {str(e)}")
