from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ChartOfAccountsRepository
from ....domain.entities.ledger_entity import ChartOfAccounts
from .command import UpdateChartOfAccountsCommand

class UpdateChartOfAccountsHandler(RequestHandlerBase[UpdateChartOfAccountsCommand, Result[ChartOfAccounts]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateChartOfAccountsCommand) -> Result[ChartOfAccounts]:
        try:
            with self._unit_of_work as uow:
                repo = ChartOfAccountsRepository(uow.session)
                
                chartofaccounts = repo.get_by_id(command.chartofaccounts_id, command.tenant_id)
                if not chartofaccounts:
                    return Result.failure("ChartOfAccounts not found")
                
                                if command.account_category is not None:
                    chartofaccounts.account_category = command.account_category
                if command.account_code is not None:
                    chartofaccounts.account_code = command.account_code
                if command.account_name is not None:
                    chartofaccounts.account_name = command.account_name
                if command.account_type is not None:
                    chartofaccounts.account_type = command.account_type
                if command.created_by is not None:
                    chartofaccounts.created_by = uuid.UUID(command.created_by) if command.created_by else None
                if command.currency is not None:
                    chartofaccounts.currency = command.currency
                if command.current_balance is not None:
                    chartofaccounts.current_balance = command.current_balance
                if command.description is not None:
                    chartofaccounts.description = command.description
                if command.is_active is not None:
                    chartofaccounts.is_active = command.is_active
                if command.is_system_account is not None:
                    chartofaccounts.is_system_account = command.is_system_account
                if command.opening_balance is not None:
                    chartofaccounts.opening_balance = command.opening_balance
                if command.parent_account_id is not None:
                    chartofaccounts.parent_account_id = uuid.UUID(command.parent_account_id) if command.parent_account_id else None
                
                chartofaccounts.updatedAt = datetime.utcnow()
                repo.update(chartofaccounts)
                uow.commit()
                
                return Result.success(chartofaccounts)
                
        except Exception as e:
            return Result.failure(f"Failed to update chartofaccounts: {str(e)}")
