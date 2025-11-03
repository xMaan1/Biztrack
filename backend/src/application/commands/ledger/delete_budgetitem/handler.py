from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BudgetItemRepository
from .command import DeleteBudgetItemCommand

class DeleteBudgetItemHandler(RequestHandlerBase[DeleteBudgetItemCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteBudgetItemCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = BudgetItemRepository(uow.session)
                
                budgetitem = repo.get_by_id(command.budgetitem_id, command.tenant_id)
                if not budgetitem:
                    return Result.failure("BudgetItem not found")
                
                repo.delete(budgetitem)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete budgetitem: {str(e)}")
