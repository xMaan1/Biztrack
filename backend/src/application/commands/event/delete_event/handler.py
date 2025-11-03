from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EventRepository
from .command import DeleteEventCommand

class DeleteEventHandler(RequestHandlerBase[DeleteEventCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteEventCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = EventRepository(uow.session)
                
                event = repo.get_by_id(command.event_id, command.tenant_id)
                if not event:
                    return Result.failure("Event not found")
                
                repo.delete(event)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete event: {str(e)}")
