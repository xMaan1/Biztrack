from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionPlanRepository
from .command import DeleteProductionPlanCommand

class DeleteProductionPlanHandler(RequestHandlerBase[DeleteProductionPlanCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteProductionPlanCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionPlanRepository(uow.session)
                
                productionplan = repo.get_by_id(command.productionplan_id, command.tenant_id)
                if not productionplan:
                    return Result.failure("ProductionPlan not found")
                
                repo.delete(productionplan)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete productionplan: {str(e)}")
