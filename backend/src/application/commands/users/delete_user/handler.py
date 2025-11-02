from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import UserRepository
from .command import DeleteUserCommand

class DeleteUserHandler(RequestHandlerBase[DeleteUserCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteUserCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                user_repo = UserRepository(uow.session)
                
                success = user_repo.delete(command.user_id)
                if not success:
                    return Result.failure("User not found")
                
                uow.commit()
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete user: {str(e)}")

