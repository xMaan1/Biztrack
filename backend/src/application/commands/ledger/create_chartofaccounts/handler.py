from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ChartOfAccountsRepository
from ....domain.entities.ledger_entity import ChartOfAccounts
from .command import CreateChartOfAccountsCommand

class CreateChartOfAccountsHandler(RequestHandlerBase[CreateChartOfAccountsCommand, Result[ChartOfAccounts]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateChartOfAccountsCommand) -> Result[ChartOfAccounts]:
        try:
            with self._unit_of_work as uow:
                repo = ChartOfAccountsRepository(uow.session)
                
                chartofaccounts = ChartOfAccounts(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    account_category=command.account_category,
                    account_code=command.account_code,
                    account_name=command.account_name,
                    account_type=command.account_type,
                    created_by=uuid.UUID(command.created_by),
                    currency=command.currency,
                    current_balance=command.current_balance,
                    description=command.description,
                    is_active=command.is_active,
                    is_system_account=command.is_system_account,
                    opening_balance=command.opening_balance,
                    parent_account_id=uuid.UUID(command.parent_account_id),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(chartofaccounts)
                uow.commit()
                return Result.success(chartofaccounts)
                
        except Exception as e:
            return Result.failure(f"Failed to create chartofaccounts: {str(e)}")
