from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ApplicationRepository
from .command import DeleteApplicationCommand

class DeleteApplicationHandler(RequestHandlerBase[DeleteApplicationCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteApplicationCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = ApplicationRepository(uow.session)
                
                application = repo.get_by_id(command.application_id, command.tenant_id)
                if not application:
                    return Result.failure("Application not found")
                
                repo.delete(application)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete application: {str(e)}")
