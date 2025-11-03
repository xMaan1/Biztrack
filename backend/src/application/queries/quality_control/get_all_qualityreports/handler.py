from sqlalchemy import and_, desc, asc
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....core.paged_result import PagedResult
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import QualityReportRepository
from ....domain.entities.quality_control_entity import QualityReport
from .query import GetAllQualityReportsQuery

class GetAllQualityReportsHandler(RequestHandlerBase[GetAllQualityReportsQuery, Result[PagedResult[QualityReport]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetAllQualityReportsQuery) -> Result[PagedResult[QualityReport]]:
        try:
            with self._unit_of_work as uow:
                repo = QualityReportRepository(uow.session)
                import uuid
                
                filters = [QualityReport.tenant_id == uuid.UUID(query.tenant_id)]
                
                base_query = repo._session.query(QualityReport).filter(and_(*filters))
                total = base_query.count()
                
                sort_column = QualityReport.createdAt if hasattr(QualityReport, 'createdAt') else QualityReport.id
                
                order_func = desc if query.sort_order == "desc" else asc
                entities = base_query.order_by(order_func(sort_column)).offset(query.skip).limit(query.page_size).all()
                
                return Result.success(PagedResult(
                    items=entities,
                    total=total,
                    page=query.page,
                    page_size=query.page_size
                ))
        except Exception as e:
            return Result.failure(f"Failed to get qualityreports: {str(e)}")
