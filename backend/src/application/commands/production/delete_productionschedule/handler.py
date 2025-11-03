from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProductionScheduleRepository
from .command import DeleteProductionScheduleCommand

class DeleteProductionScheduleHandler(RequestHandlerBase[DeleteProductionScheduleCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteProductionScheduleCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = ProductionScheduleRepository(uow.session)
                
                productionschedule = repo.get_by_id(command.productionschedule_id, command.tenant_id)
                if not productionschedule:
                    return Result.failure("ProductionSchedule not found")
                
                repo.delete(productionschedule)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete productionschedule: {str(e)}")
