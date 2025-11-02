from typing import Optional
from datetime import datetime
import uuid
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import UserRepository
from ....domain.entities.core_entity import User
from ....core.auth import get_password_hash
from .command import CreateUserCommand

class CreateUserHandler(RequestHandlerBase[CreateUserCommand, Result[User]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: CreateUserCommand) -> Result[User]:
        try:
            with self._unit_of_work as uow:
                user_repo = UserRepository(uow.session)
                
                existing_user = user_repo.get_by_email(command.email)
                if existing_user:
                    return Result.failure("Email already registered")
                
                existing_username = user_repo.get_by_username(command.userName)
                if existing_username:
                    return Result.failure("Username already taken")
                
                hashed_password = get_password_hash(command.password)
                
                user_entity = User(
                    id=uuid.uuid4(),
                    tenant_id=uuid.UUID(command.tenant_id) if command.tenant_id else None,
                    userName=command.userName,
                    email=command.email,
                    firstName=command.firstName,
                    lastName=command.lastName,
                    hashedPassword=hashed_password,
                    userRole=command.userRole,
                    avatar=command.avatar,
                    isActive=True,
                    createdAt=datetime.utcnow(),
                    updatedAt=datetime.utcnow()
                )
                
                user_repo.add(user_entity)
                uow.commit()
                
                return Result.success(user_entity)
                
        except Exception as e:
            return Result.failure(f"Failed to create user: {str(e)}")

