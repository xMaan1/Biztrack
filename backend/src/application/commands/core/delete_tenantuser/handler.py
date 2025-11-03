from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TenantUserRepository
from .command import DeleteTenantUserCommand

class DeleteTenantUserHandler(RequestHandlerBase[DeleteTenantUserCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteTenantUserCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = TenantUserRepository(uow.session)
                
                tenantuser = repo.get_by_id(command.tenantuser_id, command.tenant_id)
                if not tenantuser:
                    return Result.failure("TenantUser not found")
                
                repo.delete(tenantuser)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete tenantuser: {str(e)}")
