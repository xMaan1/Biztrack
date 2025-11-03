from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import TillRepository
from ....domain.entities.banking_entity import Till
from .query import GetAllTillsQuery

class GetAllTillsHandler(RequestHandlerBase[GetAllTillsQuery, Result[PagedResult[Till]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllTillsQuery) -> Result[PagedResult[Till]]:
        try:
            with self._unit_of_work as uow:
                till_repo = TillRepository(uow.session)
                import uuid
                
                filters = [Till.tenant_id == uuid.UUID(query.tenant_id)]
                
                base_query = till_repo._session.query(Till).filter(and_(*filters))
                total = base_query.count()
                
                sort_column = Till.name
                if query.sort_by == "current_balance":
                    sort_column = Till.current_balance
                elif query.sort_by == "created_at":
                    sort_column = Till.created_at
                
                order_func = desc if query.sort_order == "desc" else asc
                tills = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=tills,
                    total=total,
                    page=query.page,
                    page_size=query.page_size
                ))
        except Exception as e:
            return Result.failure(f"Failed to get tills: {str(e)}")

