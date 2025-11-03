from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import POSShiftRepository
from .command import DeletePOSShiftCommand

class DeletePOSShiftHandler(RequestHandlerBase[DeletePOSShiftCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeletePOSShiftCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = POSShiftRepository(uow.session)
                
                posshift = repo.get_by_id(command.posshift_id, command.tenant_id)
                if not posshift:
                    return Result.failure("POSShift not found")
                
                repo.delete(posshift)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete posshift: {str(e)}")
