from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import LeadRepository
from ....domain.entities.crm_entity import Lead
from .query import GetLeadByIdQuery

class GetLeadByIdHandler(RequestHandlerBase[GetLeadByIdQuery, Result[Optional[Lead]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetLeadByIdQuery) -> Result[Optional[Lead]]:
        try:
            with self._unit_of_work as uow:
                repo = LeadRepository(uow.session)
                entity = repo.get_by_id(query.lead_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get lead: {str(e)}")
