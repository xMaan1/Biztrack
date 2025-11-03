from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityDefectRepository
from ....domain.entities.quality_control_entity import QualityDefect
from .query import GetAllQualityDefectsQuery

class GetAllQualityDefectsHandler(RequestHandlerBase[GetAllQualityDefectsQuery, Result[PagedResult[QualityDefect]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllQualityDefectsQuery) -> Result[PagedResult[QualityDefect]]:
        try:
            with self._unit_of_work as uow:
                repo = QualityDefectRepository(uow.session)
                import uuid
                
                filters = [QualityDefect.tenant_id == uuid.UUID(query.tenant_id)]
                
                base_query = repo._session.query(QualityDefect).filter(and_(*filters))
                total = base_query.count()
                
                sort_column = QualityDefect.createdAt if hasattr(QualityDefect, 'createdAt') else QualityDefect.id
                
                order_func = desc if query.sort_order == "desc" else asc
                entities = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=entities,
                    total=total,
                    page=query.page,
                    page_size=query.page_size
                ))
        except Exception as e:
            return Result.failure(f"Failed to get qualitydefects: {str(e)}")
