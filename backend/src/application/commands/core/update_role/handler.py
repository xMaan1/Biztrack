from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import RoleRepository
from ....domain.entities.core_entity import Role
from .command import UpdateRoleCommand

class UpdateRoleHandler(RequestHandlerBase[UpdateRoleCommand, Result[Role]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateRoleCommand) -> Result[Role]:
        try:
            with self._unit_of_work as uow:
                repo = RoleRepository(uow.session)
                
                role = repo.get_by_id(command.role_id, command.tenant_id)
                if not role:
                    return Result.failure("Role not found")
                
                                if command.description is not None:
                    role.description = command.description
                if command.display_name is not None:
                    role.display_name = command.display_name
                if command.isActive is not None:
                    role.isActive = command.isActive
                if command.name is not None:
                    role.name = command.name
                if command.permissions is not None:
                    role.permissions = command.permissions or []
                
                role.updatedAt = datetime.utcnow()
                repo.update(role)
                uow.commit()
                
                return Result.success(role)
                
        except Exception as e:
            return Result.failure(f"Failed to update role: {str(e)}")
