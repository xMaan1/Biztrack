from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import EmployeeRepository
from .command import DeleteEmployeeCommand

class DeleteEmployeeHandler(RequestHandlerBase[DeleteEmployeeCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteEmployeeCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                employee_repo = EmployeeRepository(uow.session)
                
                success = employee_repo.delete(command.employee_id, command.tenant_id)
                if not success:
                    return Result.failure("Employee not found")
                
                uow.commit()
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete employee: {str(e)}")

