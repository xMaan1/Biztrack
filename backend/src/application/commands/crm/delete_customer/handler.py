from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import CustomerRepository
from .command import DeleteCustomerCommand

class DeleteCustomerHandler(RequestHandlerBase[DeleteCustomerCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteCustomerCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                customer_repo = CustomerRepository(uow.session)
                
                success = customer_repo.delete(command.customer_id, command.tenant_id)
                if not success:
                    return Result.failure("Customer not found")
                
                uow.commit()
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete customer: {str(e)}")

