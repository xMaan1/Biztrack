from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import WarehouseRepository
from .command import DeleteWarehouseCommand

class DeleteWarehouseHandler(RequestHandlerBase[DeleteWarehouseCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteWarehouseCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                warehouse_repo = WarehouseRepository(uow.session)
                
                success = warehouse_repo.delete(command.warehouse_id, command.tenant_id)
                if not success:
                    return Result.failure("Warehouse not found")
                
                uow.commit()
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete warehouse: {str(e)}")

