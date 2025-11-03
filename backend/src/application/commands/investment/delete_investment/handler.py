from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvestmentRepository
from .command import DeleteInvestmentCommand

class DeleteInvestmentHandler(RequestHandlerBase[DeleteInvestmentCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteInvestmentCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = InvestmentRepository(uow.session)
                
                investment = repo.get_by_id(command.investment_id, command.tenant_id)
                if not investment:
                    return Result.failure("Investment not found")
                
                repo.delete(investment)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete investment: {str(e)}")
