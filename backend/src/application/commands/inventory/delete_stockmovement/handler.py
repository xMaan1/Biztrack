from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import StockMovementRepository
from .command import DeleteStockMovementCommand

class DeleteStockMovementHandler(RequestHandlerBase[DeleteStockMovementCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteStockMovementCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = StockMovementRepository(uow.session)
                
                stockmovement = repo.get_by_id(command.stockmovement_id, command.tenant_id)
                if not stockmovement:
                    return Result.failure("StockMovement not found")
                
                repo.delete(stockmovement)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete stockmovement: {str(e)}")
