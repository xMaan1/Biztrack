from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import StorageLocationRepository
from .command import DeleteStorageLocationCommand

class DeleteStorageLocationHandler(RequestHandlerBase[DeleteStorageLocationCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteStorageLocationCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = StorageLocationRepository(uow.session)
                
                storagelocation = repo.get_by_id(command.storagelocation_id, command.tenant_id)
                if not storagelocation:
                    return Result.failure("StorageLocation not found")
                
                repo.delete(storagelocation)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete storagelocation: {str(e)}")
