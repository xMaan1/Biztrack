from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TenantUserRepository
from ....domain.entities.core_entity import TenantUser
from .command import CreateTenantUserCommand

class CreateTenantUserHandler(RequestHandlerBase[CreateTenantUserCommand, Result[TenantUser]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateTenantUserCommand) -> Result[TenantUser]:
        try:
            with self._unit_of_work as uow:
                repo = TenantUserRepository(uow.session)
                
                tenantuser = TenantUser(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    custom_permissions=command.custom_permissions or [],
                    invitedBy=uuid.UUID(command.invitedBy),
                    isActive=command.isActive,
                    joinedAt=datetime.fromisoformat(command.joinedAt.replace('Z', '+00:00')) if command.joinedAt else datetime.utcnow(),
                    role=command.role,
                    role_id=uuid.UUID(command.role_id),
                    userId=uuid.UUID(command.userId),
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(tenantuser)
                uow.commit()
                return Result.success(tenantuser)
                
        except Exception as e:
            return Result.failure(f"Failed to create tenantuser: {str(e)}")
