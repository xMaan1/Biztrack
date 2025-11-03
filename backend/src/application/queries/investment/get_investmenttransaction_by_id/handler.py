from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvestmentTransactionRepository
from ....domain.entities.investment_entity import InvestmentTransaction
from .query import GetInvestmentTransactionByIdQuery

class GetInvestmentTransactionByIdHandler(RequestHandlerBase[GetInvestmentTransactionByIdQuery, Result[Optional[InvestmentTransaction]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetInvestmentTransactionByIdQuery) -> Result[Optional[InvestmentTransaction]]:
        try:
            with self._unit_of_work as uow:
                repo = InvestmentTransactionRepository(uow.session)
                entity = repo.get_by_id(query.investmenttransaction_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get investmenttransaction: {str(e)}")
