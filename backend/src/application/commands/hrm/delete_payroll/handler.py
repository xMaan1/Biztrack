from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PayrollRepository
from .command import DeletePayrollCommand

class DeletePayrollHandler(RequestHandlerBase[DeletePayrollCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeletePayrollCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = PayrollRepository(uow.session)
                
                payroll = repo.get_by_id(command.payroll_id, command.tenant_id)
                if not payroll:
                    return Result.failure("Payroll not found")
                
                repo.delete(payroll)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete payroll: {str(e)}")
