from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvoiceCustomizationRepository
from ....domain.entities.invoice_customization_entity import InvoiceCustomization
from .query import GetInvoiceCustomizationByIdQuery

class GetInvoiceCustomizationByIdHandler(RequestHandlerBase[GetInvoiceCustomizationByIdQuery, Result[Optional[InvoiceCustomization]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetInvoiceCustomizationByIdQuery) -> Result[Optional[InvoiceCustomization]]:
        try:
            with self._unit_of_work as uow:
                repo = InvoiceCustomizationRepository(uow.session)
                entity = repo.get_by_id(query.invoicecustomization_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get invoicecustomization: {str(e)}")
