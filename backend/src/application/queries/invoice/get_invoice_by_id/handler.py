from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import InvoiceRepository
from ....domain.entities.invoice_entity import Invoice
from .query import GetInvoiceByIdQuery

class GetInvoiceByIdHandler(RequestHandlerBase[GetInvoiceByIdQuery, Result[Optional[Invoice]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetInvoiceByIdQuery) -> Result[Optional[Invoice]]:
        try:
            with self._unit_of_work as uow:
                repo = InvoiceRepository(uow.session)
                entity = repo.get_by_id(query.invoice_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get invoice: {str(e)}")
