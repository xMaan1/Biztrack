from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceScheduleRepository
from .command import DeleteMaintenanceScheduleCommand

class DeleteMaintenanceScheduleHandler(RequestHandlerBase[DeleteMaintenanceScheduleCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteMaintenanceScheduleCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceScheduleRepository(uow.session)
                
                maintenanceschedule = repo.get_by_id(command.maintenanceschedule_id, command.tenant_id)
                if not maintenanceschedule:
                    return Result.failure("MaintenanceSchedule not found")
                
                repo.delete(maintenanceschedule)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete maintenanceschedule: {str(e)}")
