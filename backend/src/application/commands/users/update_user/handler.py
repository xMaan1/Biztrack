from datetime import datetime
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import UserRepository
from ....domain.entities.core_entity import User
from ....core.auth import get_password_hash
from .command import UpdateUserCommand

class UpdateUserHandler(RequestHandlerBase[UpdateUserCommand, Result[User]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: UpdateUserCommand) -> Result[User]:
        try:
            with self._unit_of_work as uow:
                user_repo = UserRepository(uow.session)
                
                user = user_repo.get_by_id(command.user_id)
                if not user:
                    return Result.failure("User not found")
                
                if command.email and command.email != user.email:
                    existing_user = user_repo.get_by_email(command.email)
                    if existing_user and str(existing_user.id) != command.user_id:
                        return Result.failure("Email already registered")
                    user.email = command.email
                
                if command.userName and command.userName != user.userName:
                    existing_username = user_repo.get_by_username(command.userName)
                    if existing_username and str(existing_username.id) != command.user_id:
                        return Result.failure("Username already taken")
                    user.userName = command.userName
                
                if command.firstName is not None:
                    user.firstName = command.firstName
                if command.lastName is not None:
                    user.lastName = command.lastName
                if command.userRole is not None:
                    user.userRole = command.userRole
                if command.avatar is not None:
                    user.avatar = command.avatar
                if command.password:
                    user.hashedPassword = get_password_hash(command.password)
                
                user.updatedAt = datetime.utcnow()
                user_repo.update(user)
                uow.commit()
                
                return Result.success(user)
                
        except Exception as e:
            return Result.failure(f"Failed to update user: {str(e)}")

