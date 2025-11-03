from typing import List
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import UserRepository
from ....domain.entities.core_entity import User
from .query import GetAllUsersQuery

class GetAllUsersHandler(RequestHandlerBase[GetAllUsersQuery, Result[PagedResult[User]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllUsersQuery) -> Result[PagedResult[User]]:
        try:
            with self._unit_of_work as uow:
                user_repo = UserRepository(uow.session)
                
                skip = query.skip
                users = user_repo.get_all(
                    tenant_id=query.tenant_id,
                    skip=skip,
                    limit=query.page_size,
                    order_by=query.sort_by,
                    order_desc=(query.sort_order == 'desc')
                )
                
                total_count = user_repo.count(query.tenant_id)
                
                paged_result = PagedResult(
                    items=users,
                    page=query.page,
                    page_size=query.page_size,
                    total_count=total_count
                )
                
                return Result.success(paged_result)
        except Exception as e:
            return Result.failure(f"Failed to get users: {str(e)}")

