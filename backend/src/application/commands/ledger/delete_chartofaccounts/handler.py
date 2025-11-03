from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ChartOfAccountsRepository
from .command import DeleteChartOfAccountsCommand

class DeleteChartOfAccountsHandler(RequestHandlerBase[DeleteChartOfAccountsCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteChartOfAccountsCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = ChartOfAccountsRepository(uow.session)
                
                chartofaccounts = repo.get_by_id(command.chartofaccounts_id, command.tenant_id)
                if not chartofaccounts:
                    return Result.failure("ChartOfAccounts not found")
                
                repo.delete(chartofaccounts)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete chartofaccounts: {str(e)}")
