from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import FinancialPeriodRepository
from ....domain.entities.ledger_entity import FinancialPeriod
from .query import GetAllFinancialPeriodsQuery

class GetAllFinancialPeriodsHandler(RequestHandlerBase[GetAllFinancialPeriodsQuery, Result[PagedResult[FinancialPeriod]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllFinancialPeriodsQuery) -> Result[PagedResult[FinancialPeriod]]:
        try:
            with self._unit_of_work as uow:
                repo = FinancialPeriodRepository(uow.session)
                import uuid
                
                filters = [FinancialPeriod.tenant_id == uuid.UUID(query.tenant_id)]
                
                base_query = repo._session.query(FinancialPeriod).filter(and_(*filters))
                total = base_query.count()
                
                sort_column = FinancialPeriod.createdAt if hasattr(FinancialPeriod, 'createdAt') else FinancialPeriod.id
                
                order_func = desc if query.sort_order == "desc" else asc
                entities = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=entities,
                    total=total,
                    page=query.page,
                    page_size=query.page_size
                ))
        except Exception as e:
            return Result.failure(f"Failed to get financialperiods: {str(e)}")
