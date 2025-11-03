from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionStepRepository
from .command import DeleteProductionStepCommand

class DeleteProductionStepHandler(RequestHandlerBase[DeleteProductionStepCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteProductionStepCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionStepRepository(uow.session)
                
                productionstep = repo.get_by_id(command.productionstep_id, command.tenant_id)
                if not productionstep:
                    return Result.failure("ProductionStep not found")
                
                repo.delete(productionstep)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete productionstep: {str(e)}")
