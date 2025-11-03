from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import FinancialPeriodRepository
from .command import DeleteFinancialPeriodCommand

class DeleteFinancialPeriodHandler(RequestHandlerBase[DeleteFinancialPeriodCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteFinancialPeriodCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = FinancialPeriodRepository(uow.session)
                
                financialperiod = repo.get_by_id(command.financialperiod_id, command.tenant_id)
                if not financialperiod:
                    return Result.failure("FinancialPeriod not found")
                
                repo.delete(financialperiod)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete financialperiod: {str(e)}")
