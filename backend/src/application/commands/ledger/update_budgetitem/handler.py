from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BudgetItemRepository
from ....domain.entities.ledger_entity import BudgetItem
from .command import UpdateBudgetItemCommand

class UpdateBudgetItemHandler(RequestHandlerBase[UpdateBudgetItemCommand, Result[BudgetItem]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateBudgetItemCommand) -> Result[BudgetItem]:
        try:
            with self._unit_of_work as uow:
                repo = BudgetItemRepository(uow.session)
                
                budgetitem = repo.get_by_id(command.budgetitem_id, command.tenant_id)
                if not budgetitem:
                    return Result.failure("BudgetItem not found")
                
                                if command.account_id is not None:
                    budgetitem.account_id = uuid.UUID(command.account_id) if command.account_id else None
                if command.allocated_amount is not None:
                    budgetitem.allocated_amount = command.allocated_amount
                if command.budget_id is not None:
                    budgetitem.budget_id = uuid.UUID(command.budget_id) if command.budget_id else None
                if command.budgeted_amount is not None:
                    budgetitem.budgeted_amount = command.budgeted_amount
                if command.notes is not None:
                    budgetitem.notes = command.notes
                if command.remaining_amount is not None:
                    budgetitem.remaining_amount = command.remaining_amount
                if command.spent_amount is not None:
                    budgetitem.spent_amount = command.spent_amount
                
                budgetitem.updatedAt = datetime.utcnow()
                repo.update(budgetitem)
                uow.commit()
                
                return Result.success(budgetitem)
                
        except Exception as e:
            return Result.failure(f"Failed to update budgetitem: {str(e)}")
