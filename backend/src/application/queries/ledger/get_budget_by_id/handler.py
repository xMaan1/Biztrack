from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BudgetRepository
from ....domain.entities.ledger_entity import Budget
from .query import GetBudgetByIdQuery

class GetBudgetByIdHandler(RequestHandlerBase[GetBudgetByIdQuery, Result[Optional[Budget]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetBudgetByIdQuery) -> Result[Optional[Budget]]:
        try:
            with self._unit_of_work as uow:
                repo = BudgetRepository(uow.session)
                entity = repo.get_by_id(query.budget_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get budget: {str(e)}")
