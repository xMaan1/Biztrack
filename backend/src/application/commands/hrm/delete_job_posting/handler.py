from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import JobPostingRepository
from .command import DeleteJobPostingCommand

class DeleteJobPostingHandler(RequestHandlerBase[DeleteJobPostingCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteJobPostingCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = JobPostingRepository(uow.session)
                
                success = repo.delete(command.job_id, command.tenant_id)
                if not success:
                    return Result.failure("Job posting not found")
                
                uow.commit()
                return Result.success(True)
        except Exception as e:
            return Result.failure(f"Failed to delete job posting: {str(e)}")

