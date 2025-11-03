from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvestmentRepository
from ....domain.entities.investment_entity import Investment
from .query import GetInvestmentByIdQuery

class GetInvestmentByIdHandler(RequestHandlerBase[GetInvestmentByIdQuery, Result[Optional[Investment]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetInvestmentByIdQuery) -> Result[Optional[Investment]]:
        try:
            with self._unit_of_work as uow:
                repo = InvestmentRepository(uow.session)
                entity = repo.get_by_id(query.investment_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get investment: {str(e)}")
