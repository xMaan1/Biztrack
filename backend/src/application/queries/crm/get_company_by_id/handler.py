from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import CompanyRepository
from ....domain.entities.crm_entity import Company
from .query import GetCompanyByIdQuery

class GetCompanyByIdHandler(RequestHandlerBase[GetCompanyByIdQuery, Result[Optional[Company]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetCompanyByIdQuery) -> Result[Optional[Company]]:
        try:
            with self._unit_of_work as uow:
                repo = CompanyRepository(uow.session)
                entity = repo.get_by_id(query.company_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get company: {str(e)}")
