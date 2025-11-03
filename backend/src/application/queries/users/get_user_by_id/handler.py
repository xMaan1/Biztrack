from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import UserRepository
from ....domain.entities.core_entity import User
from .query import GetUserByIdQuery

class GetUserByIdHandler(RequestHandlerBase[GetUserByIdQuery, Result[Optional[User]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetUserByIdQuery) -> Result[Optional[User]]:
        try:
            with self._unit_of_work as uow:
                user_repo = UserRepository(uow.session)
                user = user_repo.get_by_id(query.user_id)
                return Result.success(user)
        except Exception as e:
            return Result.failure(f"Failed to get user: {str(e)}")

