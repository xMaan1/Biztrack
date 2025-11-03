from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TimeEntryRepository
from .command import DeleteTimeEntryCommand

class DeleteTimeEntryHandler(RequestHandlerBase[DeleteTimeEntryCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteTimeEntryCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = TimeEntryRepository(uow.session)
                
                timeentry = repo.get_by_id(command.timeentry_id, command.tenant_id)
                if not timeentry:
                    return Result.failure("TimeEntry not found")
                
                repo.delete(timeentry)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete timeentry: {str(e)}")
