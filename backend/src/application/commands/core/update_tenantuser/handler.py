from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TenantUserRepository
from ....domain.entities.core_entity import TenantUser
from .command import UpdateTenantUserCommand

class UpdateTenantUserHandler(RequestHandlerBase[UpdateTenantUserCommand, Result[TenantUser]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateTenantUserCommand) -> Result[TenantUser]:
        try:
            with self._unit_of_work as uow:
                repo = TenantUserRepository(uow.session)
                
                tenantuser = repo.get_by_id(command.tenantuser_id, command.tenant_id)
                if not tenantuser:
                    return Result.failure("TenantUser not found")
                
                                if command.custom_permissions is not None:
                    tenantuser.custom_permissions = command.custom_permissions or []
                if command.invitedBy is not None:
                    tenantuser.invitedBy = uuid.UUID(command.invitedBy) if command.invitedBy else None
                if command.isActive is not None:
                    tenantuser.isActive = command.isActive
                if command.joinedAt is not None:
                    tenantuser.joinedAt = datetime.fromisoformat(command.joinedAt.replace('Z', '+00:00')) if command.joinedAt else None
                if command.role is not None:
                    tenantuser.role = command.role
                if command.role_id is not None:
                    tenantuser.role_id = uuid.UUID(command.role_id) if command.role_id else None
                if command.userId is not None:
                    tenantuser.userId = uuid.UUID(command.userId) if command.userId else None
                
                tenantuser.updatedAt = datetime.utcnow()
                repo.update(tenantuser)
                uow.commit()
                
                return Result.success(tenantuser)
                
        except Exception as e:
            return Result.failure(f"Failed to update tenantuser: {str(e)}")
