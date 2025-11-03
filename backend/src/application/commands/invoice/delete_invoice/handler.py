from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvoiceRepository
from .command import DeleteInvoiceCommand

class DeleteInvoiceHandler(RequestHandlerBase[DeleteInvoiceCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteInvoiceCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = InvoiceRepository(uow.session)
                
                invoice = repo.get_by_id(command.invoice_id, command.tenant_id)
                if not invoice:
                    return Result.failure("Invoice not found")
                
                repo.delete(invoice)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete invoice: {str(e)}")
