from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TillTransactionRepository
from ....domain.entities.banking_entity import TillTransaction
from .query import GetAllTillTransactionsQuery

class GetAllTillTransactionsHandler(RequestHandlerBase[GetAllTillTransactionsQuery, Result[PagedResult[TillTransaction]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllTillTransactionsQuery) -> Result[PagedResult[TillTransaction]]:
        try:
            with self._unit_of_work as uow:
                transaction_repo = TillTransactionRepository(uow.session)
                import uuid
                
                filters = [TillTransaction.tenant_id == uuid.UUID(query.tenant_id)]
                
                if query.till_id:
                    filters.append(TillTransaction.till_id == uuid.UUID(query.till_id))
                
                base_query = transaction_repo._session.query(TillTransaction).filter(and_(*filters))
                total = base_query.count()
                
                sort_column = TillTransaction.transaction_date
                if query.sort_by == "amount":
                    sort_column = TillTransaction.amount
                
                order_func = desc if query.sort_order == "desc" else asc
                transactions = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=transactions,
                    total=total,
                    page=query.page,
                    page_size=query.page_size
                ))
        except Exception as e:
            return Result.failure(f"Failed to get till transactions: {str(e)}")

