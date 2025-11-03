from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QuoteRepository
from ....domain.entities.sales_entity import Quote
from .query import GetQuoteByIdQuery

class GetQuoteByIdHandler(RequestHandlerBase[GetQuoteByIdQuery, Result[Optional[Quote]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetQuoteByIdQuery) -> Result[Optional[Quote]]:
        try:
            with self._unit_of_work as uow:
                repo = QuoteRepository(uow.session)
                entity = repo.get_by_id(query.quote_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get quote: {str(e)}")
