from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PaymentRepository
from ....domain.entities.invoice_entity import Payment
from .query import GetPaymentByIdQuery

class GetPaymentByIdHandler(RequestHandlerBase[GetPaymentByIdQuery, Result[Optional[Payment]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetPaymentByIdQuery) -> Result[Optional[Payment]]:
        try:
            with self._unit_of_work as uow:
                repo = PaymentRepository(uow.session)
                entity = repo.get_by_id(query.payment_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get payment: {str(e)}")
