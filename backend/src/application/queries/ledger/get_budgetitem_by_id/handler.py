from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BudgetItemRepository
from ....domain.entities.ledger_entity import BudgetItem
from .query import GetBudgetItemByIdQuery

class GetBudgetItemByIdHandler(RequestHandlerBase[GetBudgetItemByIdQuery, Result[Optional[BudgetItem]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetBudgetItemByIdQuery) -> Result[Optional[BudgetItem]]:
        try:
            with self._unit_of_work as uow:
                repo = BudgetItemRepository(uow.session)
                entity = repo.get_by_id(query.budgetitem_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get budgetitem: {str(e)}")
