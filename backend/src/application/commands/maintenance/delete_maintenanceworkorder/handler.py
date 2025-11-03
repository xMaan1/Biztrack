from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import MaintenanceWorkOrderRepository
from .command import DeleteMaintenanceWorkOrderCommand

class DeleteMaintenanceWorkOrderHandler(RequestHandlerBase[DeleteMaintenanceWorkOrderCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteMaintenanceWorkOrderCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = MaintenanceWorkOrderRepository(uow.session)
                
                maintenanceworkorder = repo.get_by_id(command.maintenanceworkorder_id, command.tenant_id)
                if not maintenanceworkorder:
                    return Result.failure("MaintenanceWorkOrder not found")
                
                repo.delete(maintenanceworkorder)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete maintenanceworkorder: {str(e)}")
