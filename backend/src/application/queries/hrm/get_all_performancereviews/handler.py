from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PerformanceReviewRepository
from ....domain.entities.hrm_entity import PerformanceReview
from .query import GetAllPerformanceReviewsQuery

class GetAllPerformanceReviewsHandler(RequestHandlerBase[GetAllPerformanceReviewsQuery, Result[PagedResult[PerformanceReview]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllPerformanceReviewsQuery) -> Result[PagedResult[PerformanceReview]]:
        try:
            with self._unit_of_work as uow:
                repo = PerformanceReviewRepository(uow.session)
                import uuid
                
                filters = [PerformanceReview.tenant_id == uuid.UUID(query.tenant_id)]
                
                base_query = repo._session.query(PerformanceReview).filter(and_(*filters))
                total = base_query.count()
                
                sort_column = PerformanceReview.createdAt if hasattr(PerformanceReview, 'createdAt') else PerformanceReview.id
                
                order_func = desc if query.sort_order == "desc" else asc
                entities = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=entities,
                    total=total,
                    page=query.page,
                    page_size=query.page_size
                ))
        except Exception as e:
            return Result.failure(f"Failed to get performancereviews: {str(e)}")
