from typing import Optional
from ....core.request_handler import RequestHandlerBase
from ....core.result import Result
from ....infrastructure.unit_of_work import UnitOfWork
from ....infrastructure.repositories import PerformanceReviewRepository
from ....domain.entities.hrm_entity import PerformanceReview
from .query import GetPerformanceReviewByIdQuery

class GetPerformanceReviewByIdHandler(RequestHandlerBase[GetPerformanceReviewByIdQuery, Result[Optional[PerformanceReview]]]):
    def __init__(self, unit_of_work: UnitOfWork):
        self._unit_of_work = unit_of_work

    async def handle(self, query: GetPerformanceReviewByIdQuery) -> Result[Optional[PerformanceReview]]:
        try:
            with self._unit_of_work as uow:
                repo = PerformanceReviewRepository(uow.session)
                entity = repo.get_by_id(query.performancereview_id, query.tenant_id)
                return Result.success(entity)
        except Exception as e:
            return Result.failure(f"Failed to get performancereview: {str(e)}")
