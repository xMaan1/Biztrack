from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import CompanyRepository
from .command import DeleteCompanyCommand

class DeleteCompanyHandler(RequestHandlerBase[DeleteCompanyCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteCompanyCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = CompanyRepository(uow.session)
                
                company = repo.get_by_id(command.company_id, command.tenant_id)
                if not company:
                    return Result.failure("Company not found")
                
                repo.delete(company)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete company: {str(e)}")
