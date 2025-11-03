from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import RoleRepository
from ....domain.entities.core_entity import Role
from .query import GetRoleByIdQuery

class GetRoleByIdHandler(RequestHandlerBase[GetRoleByIdQuery, Result[Optional[Role]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetRoleByIdQuery) -> Result[Optional[Role]]:
        try:
            with self._unit_of_work as uow:
                repo = RoleRepository(uow.session)
                entity = repo.get_by_id(query.role_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get role: {str(e)}")
