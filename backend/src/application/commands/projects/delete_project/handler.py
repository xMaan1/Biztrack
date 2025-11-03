from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import ProjectRepository
from .command import DeleteProjectCommand

class DeleteProjectHandler(RequestHandlerBase[DeleteProjectCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteProjectCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                project_repo = ProjectRepository(uow.session)
                
                success = project_repo.delete(command.project_id, command.tenant_id)
                if not success:
                    return Result.failure("Project not found")
                
                uow.commit()
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete project: {str(e)}")

