from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import RoleRepository
from .command import DeleteRoleCommand

class DeleteRoleHandler(RequestHandlerBase[DeleteRoleCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteRoleCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = RoleRepository(uow.session)
                
                role = repo.get_by_id(command.role_id, command.tenant_id)
                if not role:
                    return Result.failure("Role not found")
                
                repo.delete(role)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete role: {str(e)}")
