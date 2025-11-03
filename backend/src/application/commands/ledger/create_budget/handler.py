from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BudgetRepository
from ....domain.entities.ledger_entity import Budget
from .command import CreateBudgetCommand

class CreateBudgetHandler(RequestHandlerBase[CreateBudgetCommand, Result[Budget]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateBudgetCommand) -> Result[Budget]:
        try:
            with self._unit_of_work as uow:
                repo = BudgetRepository(uow.session)
                
                budget = Budget(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    allocated_amount=command.allocated_amount,
                    budget_name=command.budget_name,
                    budget_type=command.budget_type,
                    created_by=uuid.UUID(command.created_by),
                    description=command.description,
                    end_date=datetime.fromisoformat(command.end_date.replace('Z', '+00:00')) if command.end_date else datetime.utcnow(),
                    is_active=command.is_active,
                    notes=command.notes,
                    remaining_amount=command.remaining_amount,
                    spent_amount=command.spent_amount,
                    start_date=datetime.fromisoformat(command.start_date.replace('Z', '+00:00')) if command.start_date else datetime.utcnow(),
                    status=command.status,
                    total_budget=command.total_budget,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(budget)
                uow.commit()
                return Result.success(budget)
                
        except Exception as e:
            return Result.failure(f"Failed to create budget: {str(e)}")
