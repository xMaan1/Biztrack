from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BudgetRepository
from ....domain.entities.ledger_entity import Budget
from .command import UpdateBudgetCommand

class UpdateBudgetHandler(RequestHandlerBase[UpdateBudgetCommand, Result[Budget]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateBudgetCommand) -> Result[Budget]:
        try:
            with self._unit_of_work as uow:
                repo = BudgetRepository(uow.session)
                
                budget = repo.get_by_id(command.budget_id, command.tenant_id)
                if not budget:
                    return Result.failure("Budget not found")
                
                                if command.allocated_amount is not None:
                    budget.allocated_amount = command.allocated_amount
                if command.budget_name is not None:
                    budget.budget_name = command.budget_name
                if command.budget_type is not None:
                    budget.budget_type = command.budget_type
                if command.created_by is not None:
                    budget.created_by = uuid.UUID(command.created_by) if command.created_by else None
                if command.description is not None:
                    budget.description = command.description
                if command.end_date is not None:
                    budget.end_date = datetime.fromisoformat(command.end_date.replace('Z', '+00:00')) if command.end_date else None
                if command.is_active is not None:
                    budget.is_active = command.is_active
                if command.notes is not None:
                    budget.notes = command.notes
                if command.remaining_amount is not None:
                    budget.remaining_amount = command.remaining_amount
                if command.spent_amount is not None:
                    budget.spent_amount = command.spent_amount
                if command.start_date is not None:
                    budget.start_date = datetime.fromisoformat(command.start_date.replace('Z', '+00:00')) if command.start_date else None
                if command.status is not None:
                    budget.status = command.status
                if command.total_budget is not None:
                    budget.total_budget = command.total_budget
                
                budget.updatedAt = datetime.utcnow()
                repo.update(budget)
                uow.commit()
                
                return Result.success(budget)
                
        except Exception as e:
            return Result.failure(f"Failed to update budget: {str(e)}")
