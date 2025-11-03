from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import BudgetItemRepository
from ....domain.entities.ledger_entity import BudgetItem
from .command import CreateBudgetItemCommand

class CreateBudgetItemHandler(RequestHandlerBase[CreateBudgetItemCommand, Result[BudgetItem]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateBudgetItemCommand) -> Result[BudgetItem]:
        try:
            with self._unit_of_work as uow:
                repo = BudgetItemRepository(uow.session)
                
                budgetitem = BudgetItem(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    account_id=uuid.UUID(command.account_id),
                    allocated_amount=command.allocated_amount,
                    budget_id=uuid.UUID(command.budget_id),
                    budgeted_amount=command.budgeted_amount,
                    notes=command.notes,
                    remaining_amount=command.remaining_amount,
                    spent_amount=command.spent_amount,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(budgetitem)
                uow.commit()
                return Result.success(budgetitem)
                
        except Exception as e:
            return Result.failure(f"Failed to create budgetitem: {str(e)}")
