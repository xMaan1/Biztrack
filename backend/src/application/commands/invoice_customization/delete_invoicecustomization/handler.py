from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvoiceCustomizationRepository
from .command import DeleteInvoiceCustomizationCommand

class DeleteInvoiceCustomizationHandler(RequestHandlerBase[DeleteInvoiceCustomizationCommand, Result[bool]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, command: DeleteInvoiceCustomizationCommand) -> Result[bool]:
        try:
            with self._unit_of_work as uow:
                repo = InvoiceCustomizationRepository(uow.session)
                
                invoicecustomization = repo.get_by_id(command.invoicecustomization_id, command.tenant_id)
                if not invoicecustomization:
                    return Result.failure("InvoiceCustomization not found")
                
                repo.delete(invoicecustomization)
                uow.commit()
                
                return Result.success(True)
                
        except Exception as e:
            return Result.failure(f"Failed to delete invoicecustomization: {str(e)}")
