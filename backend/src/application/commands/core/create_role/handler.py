from datetime import datetime
import uuid
import json
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import RoleRepository
from ....domain.entities.core_entity import Role
from .command import CreateRoleCommand

class CreateRoleHandler(RequestHandlerBase[CreateRoleCommand, Result[Role]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateRoleCommand) -> Result[Role]:
        try:
            with self._unit_of_work as uow:
                repo = RoleRepository(uow.session)
                
                role = Role(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id),
                    description=command.description,
                    display_name=command.display_name,
                    isActive=command.isActive,
                    name=command.name,
                    permissions=command.permissions or [],
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                repo.add(role)
                uow.commit()
                return Result.success(role)
                
        except Exception as e:
            return Result.failure(f"Failed to create role: {str(e)}")
