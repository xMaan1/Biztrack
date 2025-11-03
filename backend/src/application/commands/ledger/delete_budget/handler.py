from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BudgetRepository
from .command import DeleteBudgetCommand

class DeleteBudgetHandler(RequestHandlerBase[DeleteBudgetCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteBudgetCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = BudgetRepository(uow.session)
                
                budget = repo.get_by_id(command.budget_id, command.tenant_id)
                if not budget:
                    return Result.failure("Budget not found")
                
                repo.delete(budget)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete budget: {str(e)}")
