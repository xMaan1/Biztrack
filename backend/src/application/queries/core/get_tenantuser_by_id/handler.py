from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TenantUserRepository
from ....domain.entities.core_entity import TenantUser
from .query import GetTenantUserByIdQuery

class GetTenantUserByIdHandler(RequestHandlerBase[GetTenantUserByIdQuery, Result[Optional[TenantUser]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetTenantUserByIdQuery) -> Result[Optional[TenantUser]]:
        try:
            with self._unit_of_work as uow:
                repo = TenantUserRepository(uow.session)
                entity = repo.get_by_id(query.tenantuser_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get tenantuser: {str(e)}")
